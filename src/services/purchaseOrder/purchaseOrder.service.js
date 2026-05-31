import mongoose from 'mongoose'
import PurchaseOrderModel, {
  PURCHASE_ORDER_STATUS,
  PO_PAYMENT_RECEIVED_STATUS,
} from '../../models/purchaseOrder.model.js'
import PoPaymentModel from '../../models/poPayment.model.js'
import PoEntryModel from '../../models/poEntry.model.js'
import QuotationModel, {
  QUOTATION_STATUS,
} from '../../models/quotation.model.js'
import QueryProductModel from '../../models/queryProduct.model.js'
import PoProductModel, {
  PO_PRODUCT_PROCUREMENT_STATUS,
  resolvePoProductLineStatus,
} from '../../models/poProduct.model.js'
import CustomError from '../../utils/exception.js'
import { getNextSequence } from '../codeSequence/codeSequence.service.js'
import { statusCodes, errorCodes } from '../../core/common/constant.js'
import {
  transformProductImagesToSigned,
  transformPathsToSignedUrls,
} from '../document/document.service.js'
import CompanyBranchModel from '../../models/companyBranch.model.js'
import { getDocumentById, toDisplayPath } from '../document/document.service.js'
import { computeTotalAmountFromProducts } from '../quotation/quotation.service.js'
import {
  upsertRateMasterEntries,
  RATE_MASTER_TYPE,
} from '../rateMaster/rateMaster.service.js'

/** Capture PO product rates into Rate_master (deduped by poCode + productCode). */
const syncPurchaseOrderRateMaster = async (po) => {
  try {
    const poCode = String(po?.poCode || '').trim()
    const products = Array.isArray(po?.products) ? po.products : []
    if (!poCode || !products.length) return

    const items = products
      .filter((p) => String(p?.rawProductCode || '').trim())
      .map((p) => ({
        productCode: p.rawProductCode,
        rate: p.rate,
        unit: p.unit,
        snapshot: {
          purchaseOrderId: String(po._id || ''),
          poCode,
          productName: p.productName || '',
          rawProductCode: p.rawProductCode || '',
          quantity: p.quantity ?? null,
          unit: p.unit || '',
          rate: p.rate ?? null,
          gstPercentage: p.gstPercentage ?? null,
          notAvailable: !!p.notAvailable,
        },
      }))

    await upsertRateMasterEntries({
      type: RATE_MASTER_TYPE.PO,
      sourceCode: poCode,
      sourceId: po._id || null,
      branchId: po.branchId || null,
      items,
    })
  } catch (err) {
    console.error('[purchaseOrder] rate_master sync failed:', err?.message || err)
  }
}

const normalizeRole = (role) =>
  String(role || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')

const isSalesRole = (role) => normalizeRole(role).startsWith('sales')

const isHodRole = (role) => {
  const normalized = normalizeRole(role)
  return normalized === 'head_of_department' || normalized === 'hod'
}

const canBypassPoHodApproval = (role) =>
  isSalesRole(role) || isHodRole(role)

const lineTaxableAmount = (p) => {
  if (!p || p.notAvailable) return 0
  const qty = Number(p.quantity) || 0
  const rate = Number(p.rate) || 0
  let lineTotal = qty * rate
  if (
    p.applyDiscount &&
    p.discountPercentage != null &&
    !Number.isNaN(Number(p.discountPercentage))
  ) {
    lineTotal -= lineTotal * (Number(p.discountPercentage) / 100)
  }
  return Math.max(0, lineTotal)
}

const lineGstPctForProduct = (p) => {
  if (typeof p?.gstPercentage === 'number' && !Number.isNaN(p.gstPercentage))
    return p.gstPercentage
  const ref =
    p?.product_id && typeof p.product_id === 'object' ? p.product_id : null
  if (
    ref &&
    typeof ref.gstPercentage === 'number' &&
    !Number.isNaN(ref.gstPercentage)
  )
    return ref.gstPercentage
  return 0
}

const hasPoPaymentLedger = (poPaymentLean) =>
  poPaymentLean && poPaymentLean._id && !poPaymentLean.isDeleted

/** Grand total (taxable + freight + packing + GST) and payment summary — matches quotation preview math.
 *  When a `po_payments` document exists, uses its `ledgers` only; otherwise uses embedded `payments`. */
export const computePurchaseOrderFinancials = (po, poPaymentLean = null) => {
  const products = po?.products || []
  let totalTaxable = 0
  let totalGst = 0
  for (const p of products) {
    const line = lineTaxableAmount(p)
    totalTaxable += line
    totalGst += line * (lineGstPctForProduct(p) / 100)
  }
  const freight = Number(po?.freightCharge) || 0
  const packing = Number(po?.packingCharge) || 0
  const taxableAfterCharges = totalTaxable + freight + packing
  const grandTotal = taxableAfterCharges + totalGst
  const useLedgers = hasPoPaymentLedger(poPaymentLean)
  const paymentEntries = useLedgers
    ? Array.isArray(poPaymentLean?.ledgers)
      ? poPaymentLean.ledgers
      : []
    : Array.isArray(po?.payments)
      ? po.payments
      : []
  const totalPaid = paymentEntries.reduce(
    (sum, e) => sum + (Number(e.amount) || 0),
    0
  )
  return {
    totalTaxable,
    totalGst,
    freightCharge: freight,
    packingCharge: packing,
    taxableAfterCharges,
    grandTotal,
    totalPaid,
    remainingAmount: Math.max(0, grandTotal - totalPaid),
  }
}

/** Keeps `poEntry` (PO billing tab) in sync with a purchase order; avoids static import cycle with poBilling. */
const syncPoEntryAfterPurchaseOrderLean = async (poLean, created_by = null) => {
  if (!poLean?._id) return
  try {
    const { upsertPoEntryLinkedToPurchaseOrder } = await import(
      '../poBilling/poBilling.service.js'
    )
    const poPayUp = await PoPaymentModel.findOne({
      purchaseOrderId: poLean._id,
      isDeleted: false,
    }).lean()
    const financials = computePurchaseOrderFinancials(poLean, poPayUp)
    await upsertPoEntryLinkedToPurchaseOrder({
      purchaseOrder: poLean,
      amount: financials.grandTotal,
      created_by,
    })
  } catch (err) {
    console.error('[syncPoEntryAfterPurchaseOrder]', err?.message || err)
  }
}

export const resolvePaymentReceivedStatus = (financials) => {
  const totalPaid = Number(financials?.totalPaid) || 0
  const remaining = Math.max(0, Number(financials?.remainingAmount) || 0)
  if (totalPaid <= 0) return PO_PAYMENT_RECEIVED_STATUS.NONE
  if (remaining <= 0.01) {
    return PO_PAYMENT_RECEIVED_STATUS.FULL_PAYMENT_RECEIVED
  }
  return PO_PAYMENT_RECEIVED_STATUS.PARTIAL_PAYMENT_RECEIVED
}

const companyFirst5 = (name) => {
  const s = (name || '')
    .toString()
    .replace(/\s+/g, '')
    .replace(/[^A-Za-z0-9]/g, '')
    .toUpperCase()
    .slice(0, 5)
  return s || 'NA'
}

const formatPoCode = (numericCode, companyName) => {
  const now = new Date()
  const DD = String(now.getDate()).padStart(2, '0')
  const MM = String(now.getMonth() + 1).padStart(2, '0')
  return `${companyFirst5(companyName)}-PO-MIG-IND-${DD}-${MM}-${numericCode}`
}

const quotationFreightToPoNumber = (value) => {
  const n = Number(value)
  return Number.isNaN(n) || n < 0 ? 0 : n
}

const OBJECT_ID_REGEX = /^[a-fA-F0-9]{24}$/

const PO_PRODUCT_PRIORITY = ['high', 'medium', 'low']

const normalizeProductPriority = (value) => {
  const s = String(value || '')
    .toLowerCase()
    .trim()
  return PO_PRODUCT_PRIORITY.includes(s) ? s : 'medium'
}

const toImageIds = (imgs) => {
  if (!Array.isArray(imgs)) return []
  return imgs
    .map((img) => (typeof img === 'object' && img?._id ? img._id : img))
    .filter((id) => typeof id === 'string' && OBJECT_ID_REGEX.test(id))
}

const toAttachmentDocumentId = (value) => {
  if (value && typeof value === 'object' && value._id != null) {
    const id = String(value._id)
    return OBJECT_ID_REGEX.test(id) ? id : null
  }
  const raw = value != null ? String(value).trim() : ''
  return raw && OBJECT_ID_REGEX.test(raw) ? raw : null
}

const cloneProductsFromQuotation = (products = []) => {
  return products.map((p) => {
    const obj =
      typeof p === 'object' && p !== null
        ? typeof p.toObject === 'function'
          ? p.toObject()
          : p
        : {}
    return {
      productName: obj.productName || '',
      description: obj.description || '',
      quantity: obj.quantity ?? 1,
      unit: obj.unit || '',
      hsnNumber: obj.hsnNumber || '',
      modelNumber: obj.modelNumber || '',
      rawProductCode: obj.rawProductCode || '',
      dispatchmentDate: obj.dispatchmentDate ?? null,
      gstPercentage: obj.gstPercentage ?? null,
      variants: Array.isArray(obj.variants) ? obj.variants : [],
      remark: obj.remark || '',
      product_id: obj.product_id || null,
      rate:
        typeof obj.rate === 'number' && !Number.isNaN(obj.rate)
          ? obj.rate
          : null,
      images: toImageIds(obj.images || []),
      applyDiscount: !!obj.applyDiscount,
      discountPercentage: obj.discountPercentage ?? null,
      discountAmount: obj.discountAmount ?? null,
      notAvailable: !!obj.notAvailable,
      notAvailableRemark: obj.notAvailableRemark || '',
      priority: normalizeProductPriority(obj.priority),
    }
  })
}

const mapQueryRates = (queryProduct) => {
  const rates = Array.isArray(queryProduct?.rates) ? queryProduct.rates : []
  return rates.map((r) => ({
    supplier: r?.supplier ?? null,
    rate:
      typeof r?.rate === 'number' && !Number.isNaN(r.rate)
        ? Number(r.rate)
        : null,
    unit: String(r?.unit || ''),
    remark: String(r?.remark || ''),
    submittedAt: r?.submittedAt || null,
    submittedBy: r?.submittedBy || null,
  }))
}

const syncPoProductsFromPurchaseOrder = async (poDoc) => {
  if (!poDoc?._id) return

  const poId = poDoc._id
  const queryId = poDoc.queryId
  const products = Array.isArray(poDoc.products) ? poDoc.products : []
  const rawCodes = products
    .map((p) => String(p?.rawProductCode || '').trim())
    .filter(Boolean)

  const queryProductRows =
    queryId && rawCodes.length
      ? await QueryProductModel.find({
          queryId,
          isDeleted: false,
          rawProductCode: { $in: rawCodes },
        })
          .select('rawProductCode rates lineIndex')
          .lean()
      : []

  const queryProductMap = new Map()
  for (const row of queryProductRows) {
    const code = String(row?.rawProductCode || '').trim()
    if (!code) continue
    if (!queryProductMap.has(code)) queryProductMap.set(code, [])
    queryProductMap.get(code).push(row)
  }

  const existingProcurement = await PoProductModel.find({
    purchaseOrderId: poId,
  })
    .select(
      'lineIndex procurementStatus paymentRequestAmount paymentRequestBillDocumentId paymentRequestRaisedAt paymentRequestRaisedBy purchaseBillingRequestId status inventoryStatus deliverySubStatus deliveryApprovedBy deliveryApprovedAt targetRate'
    )
    .lean()
  const procurementByLine = new Map(
    (existingProcurement || []).map((row) => [
      Number(row.lineIndex),
      {
        procurementStatus: row.procurementStatus,
        paymentRequestAmount: row.paymentRequestAmount,
        paymentRequestBillDocumentId: row.paymentRequestBillDocumentId,
        paymentRequestRaisedAt: row.paymentRequestRaisedAt,
        paymentRequestRaisedBy: row.paymentRequestRaisedBy,
        purchaseBillingRequestId: row.purchaseBillingRequestId,
        lineStatus: row.status ?? row.inventoryStatus,
        deliverySubStatus: row.deliverySubStatus,
        deliveryApprovedBy: row.deliveryApprovedBy,
        deliveryApprovedAt: row.deliveryApprovedAt,
        targetRate: row.targetRate,
      },
    ])
  )

  await PoProductModel.deleteMany({ purchaseOrderId: poId })
  if (!products.length) return

  const docs = products.map((product, index) => {
    const rawCode = String(product?.rawProductCode || '').trim()
    const matches = rawCode ? queryProductMap.get(rawCode) || [] : []
    const preferred =
      matches.find((m) => Number(m?.lineIndex) === index) || matches[0] || null
    const preserved = procurementByLine.get(index) || {}
    const lineStatus = preserved.lineStatus
    const proc = preserved.procurementStatus
    const status =
      lineStatus === 'purchased'
        ? 'purchased'
        : proc === 'finance_approved' || lineStatus === 'finance_approved'
          ? 'finance_approved'
          : proc === 'payment_request_raised' ||
              lineStatus === 'payment_request_raised'
            ? 'payment_request_raised'
            : lineStatus === 'ready_for_dispatchment' ||
                lineStatus === 'inventory_received' ||
                lineStatus === 'delivered'
              ? lineStatus
              : lineStatus === 'pending'
                ? 'pending'
                : 'hod_approval_pending'
    return {
      purchaseOrderId: poId,
      poCode: poDoc.poCode || '',
      quotationId: poDoc.quotationId || null,
      queryId: poDoc.queryId || null,
      industry_id: poDoc.industry_id || null,
      companyInfo: poDoc.companyInfo || {},
      branchId: poDoc.branchId || null,
      lineIndex: index,
      productName: product?.productName || '',
      description: product?.description || '',
      quantity: Number(product?.quantity) || 0,
      unit: product?.unit || '',
      hsnNumber: product?.hsnNumber || '',
      modelNumber: product?.modelNumber || '',
      rawProductCode: rawCode,
      dispatchmentDate: product?.dispatchmentDate || null,
      gstPercentage:
        typeof product?.gstPercentage === 'number' &&
        !Number.isNaN(product.gstPercentage)
          ? product.gstPercentage
          : null,
      remark: product?.remark || '',
      product_id: product?.product_id || null,
      attachmentDocumentId: toAttachmentDocumentId(
        product?.attachmentDocumentId
      ),
      poRate:
        typeof product?.rate === 'number' && !Number.isNaN(product.rate)
          ? product.rate
          : null,
      applyDiscount: !!product?.applyDiscount,
      discountPercentage:
        typeof product?.discountPercentage === 'number' &&
        !Number.isNaN(product.discountPercentage)
          ? product.discountPercentage
          : null,
      discountAmount:
        typeof product?.discountAmount === 'number' &&
        !Number.isNaN(product.discountAmount)
          ? product.discountAmount
          : null,
      notAvailable: !!product?.notAvailable,
      notAvailableRemark: product?.notAvailableRemark || '',
      priority: normalizeProductPriority(product?.priority),
      queryRate: mapQueryRates(preferred),
      procurementStatus: preserved.procurementStatus || 'open',
      paymentRequestAmount:
        preserved.paymentRequestAmount != null
          ? preserved.paymentRequestAmount
          : null,
      paymentRequestBillDocumentId:
        preserved.paymentRequestBillDocumentId || null,
      paymentRequestRaisedAt: preserved.paymentRequestRaisedAt || null,
      paymentRequestRaisedBy: preserved.paymentRequestRaisedBy || null,
      purchaseBillingRequestId: preserved.purchaseBillingRequestId || null,
      deliverySubStatus: preserved.deliverySubStatus || 'hod_approval_pending',
      deliveryApprovedBy: preserved.deliveryApprovedBy || null,
      deliveryApprovedAt: preserved.deliveryApprovedAt || null,
      targetRate: preserved.targetRate != null ? preserved.targetRate : null,
      status,
    }
  })

  await PoProductModel.insertMany(docs)
}

const assertQuotationAccess = async () => {
  return
}

export const createPurchaseOrderFromQuotation = async ({
  quotationId,
  branchFilter = {},
  currentUserId = null,
  isFullAccessRole = true,
  created_by = null,
  reuseExisting = true,
  role = '',
}) => {
  const quotation = await QuotationModel.findOne({
    _id: quotationId,
    isDeleted: false,
    ...branchFilter,
  }).lean()

  if (!quotation) {
    throw new CustomError(
      statusCodes.notFound,
      'Quotation not found',
      errorCodes.not_found
    )
  }

  await assertQuotationAccess({
    quotation,
    branchFilter,
    currentUserId,
    isFullAccessRole,
  })

  if (
    quotation.status !== QUOTATION_STATUS.HOD_APPROVED &&
    !canBypassPoHodApproval(role)
  ) {
    throw new CustomError(
      statusCodes.badRequest,
      'Quotation must be HOD approved before converting to a purchase order',
      errorCodes.bad_request
    )
  }

  if (reuseExisting) {
    const existing = await PurchaseOrderModel.findOne({
      quotationId: quotation._id,
      isDeleted: false,
    }).lean()
    if (existing) {
      await syncPoProductsFromPurchaseOrder(existing)
      await syncPoEntryAfterPurchaseOrderLean(existing, created_by)
      return existing
    }
  }

  const numericCode = await getNextSequence('purchaseOrderCode')
  const companyName = quotation.companyInfo?.name
  const poCode = formatPoCode(numericCode, companyName)
  const products = cloneProductsFromQuotation(quotation.products || [])

  const doc = await PurchaseOrderModel.create({
    poCode,
    quotationId: quotation._id,
    queryId: quotation.queryId,
    status: PURCHASE_ORDER_STATUS.DRAFT,
    companyInfo: quotation.companyInfo || {},
    industry_id: quotation.industry_id || null,
    products,
    remark: (quotation.remark || '').trim(),
    created_by: created_by || quotation.created_by || null,
    branchId: quotation.branchId || null,
    freightCharge: quotationFreightToPoNumber(quotation.freightCharge),
    packingCharge: quotation.packingCharge ?? 0,
    expectedDeliveryDate: quotation.expectedDeliveryDate ?? null,
    expectedDeliveryWithinDays: quotation.expectedDeliveryWithinDays ?? null,
  })

  const plain = doc.toObject()
  await syncPoProductsFromPurchaseOrder(plain)
  await syncPoEntryAfterPurchaseOrderLean(plain, created_by)
  await syncPurchaseOrderRateMaster(plain)
  return plain
}

export const getPurchaseOrderByQuotationId = async ({
  quotationId,
  branchFilter = {},
  currentUserId = null,
  isFullAccessRole = true,
}) => {
  const quotation = await QuotationModel.findOne({
    _id: quotationId,
    isDeleted: false,
    ...branchFilter,
  })
    .select('_id queryId')
    .lean()

  if (!quotation) {
    throw new CustomError(
      statusCodes.notFound,
      'Quotation not found',
      errorCodes.not_found
    )
  }

  await assertQuotationAccess({
    quotation,
    branchFilter,
    currentUserId,
    isFullAccessRole,
  })

  const po = await PurchaseOrderModel.findOne({
    quotationId,
    isDeleted: false,
    ...branchFilter,
  }).lean()

  return po
}

/**
 * Lines from `po_products` for a purchase order, with resolved line `status` (read-only for PO bucket).
 * Access matches {@link getPurchaseOrderById} (branch filter, etc.).
 */
export const listPoProductLinesForPurchaseOrder = async ({
  purchaseOrderId,
  poCode,
  branchFilter = {},
  currentUserId: _currentUserId = null,
  isFullAccessRole: _isFullAccessRole = true,
}) => {
  const filter = { isDeleted: false, ...branchFilter }
  if (purchaseOrderId) {
    filter._id = purchaseOrderId
  } else {
    filter.poCode = String(poCode || '').trim()
  }
  const po = await PurchaseOrderModel.findOne(filter)
    .select('_id poCode')
    .lean()
  if (!po) {
    throw new CustomError(
      statusCodes.notFound,
      'Purchase order not found',
      errorCodes.not_found
    )
  }
  const rawLines = await PoProductModel.find({
    purchaseOrderId: po._id,
    isDeleted: false,
  })
    .populate('attachmentDocumentId', 'path mimeType originalName')
    .populate('receivingDocumentId', 'path mimeType originalName')
    .populate('paymentRequestBillDocumentId', 'path mimeType originalName')
    .populate({
      path: 'product_id',
      select: 'name images',
      populate: {
        path: 'images',
        select: 'path mimeType originalName',
        model: 'document',
      },
    })
    .sort({ lineIndex: 1 })
    .lean()

  const lines = []
  for (const line of rawLines) {
    let attachmentDocumentId = line.attachmentDocumentId
    if (
      attachmentDocumentId &&
      typeof attachmentDocumentId === 'object' &&
      attachmentDocumentId.path
    ) {
      const [signed] = await transformPathsToSignedUrls([attachmentDocumentId])
      attachmentDocumentId = signed || attachmentDocumentId
    }
    let receivingDocumentId = line.receivingDocumentId
    if (
      receivingDocumentId &&
      typeof receivingDocumentId === 'object' &&
      receivingDocumentId.path
    ) {
      const [signed] = await transformPathsToSignedUrls([receivingDocumentId])
      receivingDocumentId = signed || receivingDocumentId
    }
    let paymentRequestBillDocumentId = line.paymentRequestBillDocumentId
    if (
      paymentRequestBillDocumentId &&
      typeof paymentRequestBillDocumentId === 'object' &&
      paymentRequestBillDocumentId.path
    ) {
      const [signed] = await transformPathsToSignedUrls([
        paymentRequestBillDocumentId,
      ])
      paymentRequestBillDocumentId = signed || paymentRequestBillDocumentId
    }
    let product_id = line.product_id
    if (product_id && typeof product_id === 'object') {
      product_id = await transformProductImagesToSigned(product_id)
    }

    const serializeDoc = (doc) => {
      if (!doc || typeof doc !== 'object' || !doc._id) return null
      return {
        _id: String(doc._id),
        path: doc.path || '',
        originalName: doc.originalName || '',
        mimeType: doc.mimeType || '',
      }
    }

    const lineAttachment = serializeDoc(attachmentDocumentId)
    const catalogFirst =
      product_id &&
      Array.isArray(product_id.images) &&
      product_id.images[0] &&
      typeof product_id.images[0] === 'object'
        ? serializeDoc(product_id.images[0])
        : null
    const productImageDocument = lineAttachment || catalogFirst

    lines.push({
      _id: line._id,
      lineIndex: line.lineIndex,
      productName: line.productName,
      rawProductCode: line.rawProductCode || '',
      quantity: line.quantity,
      unit: line.unit || '',
      status: resolvePoProductLineStatus(line),
      productImageDocument,
      paymentProofDocument: serializeDoc(paymentRequestBillDocumentId),
      receivingProofDocument: serializeDoc(receivingDocumentId),
    })
  }
  return {
    poCode: po.poCode || '',
    purchaseOrderId: String(po._id),
    lines,
  }
}

/**
 * Synced `po_products` lines with inventory line status (detail view / PO bucket item).
 */
const loadPoProductLineStatusesForOrder = async (purchaseOrderId) => {
  if (!purchaseOrderId) return []
  const lines = await PoProductModel.find({
    purchaseOrderId,
    isDeleted: false,
  })
    .select('lineIndex productName status inventoryStatus')
    .sort({ lineIndex: 1 })
    .lean()
  return lines.map((line) => ({
    lineIndex: line.lineIndex,
    productName: line.productName,
    status: line.status || line.inventoryStatus || 'pending',
  }))
}

export const listPurchaseOrders = async ({
  pageNumber = 1,
  pageSize = 10,
  search = '',
  status = '',
  zoneIds = '',
  employeeId = '',
  excludeFullPayment = false,
  branchFilter = {},
  currentUserId: _currentUserId = null,
  isFullAccessRole: _isFullAccessRole = true,
}) => {
  const page = Math.max(1, parseInt(pageNumber))
  const limit = Math.min(100, Math.max(1, parseInt(pageSize)))
  const skip = (page - 1) * limit

  const filter = { isDeleted: false, ...branchFilter }
  if (status && status.trim()) {
    filter.status = String(status).trim()
  }

  if (employeeId && String(employeeId).trim()) {
    const empId = String(employeeId).trim()
    if (mongoose.Types.ObjectId.isValid(empId)) {
      const employeeObjectId = new mongoose.Types.ObjectId(empId)
      filter['assigned_employee._id'] = { $in: [employeeObjectId, empId] }
    }
  }

  const omitFullPayment =
    excludeFullPayment === true ||
    excludeFullPayment === 'true' ||
    excludeFullPayment === '1'
  if (omitFullPayment) {
    filter.paymentReceivedStatus = {
      $ne: PO_PAYMENT_RECEIVED_STATUS.FULL_PAYMENT_RECEIVED,
    }
  }

  if (zoneIds && String(zoneIds).trim()) {
    const selectedZoneIds = String(zoneIds)
      .split(',')
      .map((v) => String(v || '').trim())
      .filter(Boolean)
    if (selectedZoneIds.length) {
      const zoneObjectIds = selectedZoneIds
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id))
      filter['companyInfo.area'] = {
        $in: [...selectedZoneIds, ...zoneObjectIds],
      }
    }
  }

  if (search && search.trim()) {
    const term = search.trim()
    filter.$or = [
      { poCode: { $regex: term, $options: 'i' } },
      { 'companyInfo.name': { $regex: term, $options: 'i' } },
      { 'companyInfo.location': { $regex: term, $options: 'i' } },
      { 'products.productName': { $regex: term, $options: 'i' } },
    ]
  }

  const totalItems = await PurchaseOrderModel.countDocuments(filter)

  const rows = await PurchaseOrderModel.find(filter)
    .populate('quotationId', 'quotationCode status')
    .populate('queryId', 'queryCode status')
    .populate('industry_id', 'name location email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()

  const totalPages = Math.ceil(totalItems / limit)

  const ids = rows.map((r) => r._id).filter(Boolean)
  const payRows =
    ids.length > 0
      ? await PoPaymentModel.find({
          purchaseOrderId: { $in: ids },
          isDeleted: false,
        }).lean()
      : []
  const payMap = new Map(payRows.map((p) => [String(p.purchaseOrderId), p]))

  const purchaseOrders = rows.map((row) => {
    const pPay = payMap.get(String(row._id)) || null
    return {
      ...row,
      totalAmount: computeTotalAmountFromProducts(row.products),
      financials: computePurchaseOrderFinancials(row, pPay),
    }
  })

  return {
    purchaseOrders,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  }
}

/**
 * Purchase orders where `salesEmployeeId` matches the given employee (typically the logged-in user).
 * Includes `financials` and `poPayment.ledgers` from `po_payments` (newest ledger first).
 */
export const listMyAssignedPurchaseOrders = async ({
  employeeId,
  pageNumber = 1,
  pageSize = 10,
  search = '',
  branchFilter = {},
}) => {
  const emptyPagination = (limit) => ({
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,
    itemsPerPage: limit,
    hasNextPage: false,
    hasPrevPage: false,
  })

  if (!employeeId || !mongoose.Types.ObjectId.isValid(String(employeeId))) {
    const limit = Math.min(100, Math.max(1, parseInt(pageSize) || 10))
    return { purchaseOrders: [], pagination: emptyPagination(limit) }
  }

  const employeeObjectId = new mongoose.Types.ObjectId(String(employeeId))

  const page = Math.max(1, parseInt(pageNumber))
  const limit = Math.min(100, Math.max(1, parseInt(pageSize)))
  const skip = (page - 1) * limit

  const filter = {
    isDeleted: false,
    ...branchFilter,
    salesEmployeeId: employeeObjectId,
  }

  if (search && search.trim()) {
    const term = search.trim()
    filter.$or = [
      { poCode: { $regex: term, $options: 'i' } },
      { 'companyInfo.name': { $regex: term, $options: 'i' } },
      { 'companyInfo.location': { $regex: term, $options: 'i' } },
      { 'products.productName': { $regex: term, $options: 'i' } },
    ]
  }

  const totalItems = await PurchaseOrderModel.countDocuments(filter)

  const rows = await PurchaseOrderModel.find(filter)
    .populate('quotationId', 'quotationCode status')
    .populate('queryId', 'queryCode status')
    .populate('industry_id', 'name location email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()

  const totalPages = Math.ceil(totalItems / limit) || 1

  const ids = rows.map((r) => r._id).filter(Boolean)
  const payRows =
    ids.length > 0
      ? await PoPaymentModel.find({
          purchaseOrderId: { $in: ids },
          isDeleted: false,
        }).lean()
      : []
  const payMap = new Map(payRows.map((p) => [String(p.purchaseOrderId), p]))

  const purchaseOrders = rows.map((row) => {
    const pPay = payMap.get(String(row._id)) || null
    const ledgers = pPay?.ledgers?.length
      ? [...pPay.ledgers].sort(
          (a, b) => new Date(b.paidAt) - new Date(a.paidAt)
        )
      : []
    return {
      ...row,
      totalAmount: computeTotalAmountFromProducts(row.products),
      financials: computePurchaseOrderFinancials(row, pPay),
      poPayment: { ledgers },
    }
  })

  return {
    purchaseOrders,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  }
}

export const getPurchaseOrderById = async ({
  purchaseOrderId,
  branchFilter = {},
  currentUserId: _currentUserId = null,
  isFullAccessRole: _isFullAccessRole = true,
}) => {
  const po = await PurchaseOrderModel.findOne({
    _id: purchaseOrderId,
    isDeleted: false,
    ...branchFilter,
  })
    .populate(
      'quotationId',
      'quotationCode status companyInfo industry_id products created_by'
    )
    .populate(
      'queryId',
      'queryCode status companyInfo industry_id products created_by'
    )
    .populate(
      'industry_id',
      'name location address email purchase_manager_name purchase_manager_phone'
    )
    .populate('created_by', 'name email phone role')
    .populate('salesEmployeeId', 'name email phone role designation')
    .populate({
      path: 'products.product_id',
      select: 'name shortDescription images hsnNumber gstPercentage unit',
      populate: { path: 'images', select: 'path', model: 'document' },
    })
    .populate({
      path: 'products.images',
      select: 'path',
      model: 'document',
    })
    .populate({
      path: 'attachmentDocumentId',
      select: 'path mimeType originalName',
      model: 'document',
    })
    .lean()

  if (!po) {
    throw new CustomError(
      statusCodes.notFound,
      'Purchase order not found',
      errorCodes.not_found
    )
  }

  if (po.products?.length) {
    for (const p of po.products) {
      if (p.product_id && typeof p.product_id === 'object') {
        p.product_id = await transformProductImagesToSigned(p.product_id)
      }
      if (Array.isArray(p.images) && p.images.length) {
        p.images = await transformPathsToSignedUrls(p.images)
      }
    }
  }

  if (po.attachmentDocumentId && typeof po.attachmentDocumentId === 'object') {
    const [signed] = await transformPathsToSignedUrls([po.attachmentDocumentId])
    po.attachmentDocumentId = signed || po.attachmentDocumentId
  }

  if (po.branchId) {
    const branch = await CompanyBranchModel.findById(po.branchId)
      .select('signature')
      .lean()
    const signatureId = branch?.signature ? String(branch.signature) : ''
    if (signatureId) {
      const signatureDoc = await getDocumentById(signatureId)
      if (signatureDoc?._id && signatureDoc?.path) {
        po.branchSignature = {
          _id: signatureDoc._id,
          path: await toDisplayPath(signatureDoc.path),
        }
      }
    }
  }

  const poPay = await PoPaymentModel.findOne({
    purchaseOrderId: po._id,
    isDeleted: false,
  })
    .populate('ledgers.paymentProofDocumentId', 'path mimeType originalName')
    .populate('ledgers.recordedBy', 'name email')
    .lean()

  if (poPay?.ledgers?.length) {
    for (const le of poPay.ledgers) {
      if (le?.paymentProofDocumentId?.path) {
        const [signed] = await transformPathsToSignedUrls([
          le.paymentProofDocumentId,
        ])
        le.paymentProofDocumentId = signed || le.paymentProofDocumentId
      }
    }
  }

  po.financials = computePurchaseOrderFinancials(po, poPay)
  po.poPayment = poPay || null

  const poEntry = await PoEntryModel.findOne({
    purchaseOrderId: po._id,
    isDeleted: false,
  })
    .select('entryDate')
    .lean()
  po.poReceivedDate = poEntry?.entryDate || po.createdAt || null

  po.poProductLineStatuses = await loadPoProductLineStatusesForOrder(po._id)

  return po
}

const buildPoSnapshotFromPo = (poLean, poPayLean) => ({
  poCode: poLean?.poCode,
  companyInfo: poLean?.companyInfo,
  products: poLean?.products,
  remark: poLean?.remark,
  freightCharge: poLean?.freightCharge,
  packingCharge: poLean?.packingCharge,
  status: poLean?.status,
  expectedDeliveryDate: poLean?.expectedDeliveryDate,
  expectedDeliveryWithinDays: poLean?.expectedDeliveryWithinDays,
  financials: computePurchaseOrderFinancials(poLean, poPayLean),
})

/**
 * New payment with optional proof: stored in `po_payments` (ledger) and PO `paymentReceivedStatus` updated.
 */
export const appendPoPaymentLedger = async ({
  purchaseOrderId,
  amount,
  paidAt,
  remark = '',
  paymentProofDocumentId = null,
  branchFilter = {},
  currentUserId: _currentUserId = null,
  isFullAccessRole: _isFullAccessRole = true,
}) => {
  const existing = await PurchaseOrderModel.findOne({
    _id: purchaseOrderId,
    isDeleted: false,
    ...branchFilter,
  }).lean()

  if (!existing) {
    throw new CustomError(
      statusCodes.notFound,
      'Purchase order not found',
      errorCodes.not_found
    )
  }

  const amt = Number(amount)
  if (Number.isNaN(amt) || amt <= 0) {
    throw new CustomError(
      statusCodes.badRequest,
      'amount must be a positive number',
      errorCodes.validation_error
    )
  }

  const proofId = toAttachmentDocumentId(paymentProofDocumentId)
  const newEntry = {
    amount: amt,
    paidAt: paidAt ? new Date(paidAt) : new Date(),
    remark: String(remark || '').trim(),
    paymentProofDocumentId: proofId,
    recordedBy:
      _currentUserId && OBJECT_ID_REGEX.test(String(_currentUserId))
        ? _currentUserId
        : null,
  }

  const poPayDoc = await PoPaymentModel.findOne({
    purchaseOrderId,
    isDeleted: false,
  })

  if (!poPayDoc) {
    const migrated = (
      Array.isArray(existing.payments) ? existing.payments : []
    ).map((p) => ({
      amount: Number(p.amount) || 0,
      paidAt: p.paidAt ? new Date(p.paidAt) : new Date(),
      remark: String(p.remark || '').trim(),
      paymentProofDocumentId: null,
      recordedBy: null,
    }))
    const ledgers = [...migrated, newEntry]
    await PoPaymentModel.create({
      purchaseOrderId,
      ledgers,
    })
    if (migrated.length > 0) {
      await PurchaseOrderModel.findByIdAndUpdate(purchaseOrderId, {
        $set: { payments: [] },
      })
    }
  } else {
    await PoPaymentModel.findByIdAndUpdate(poPayDoc._id, {
      $push: { ledgers: newEntry },
    })
  }

  const freshPo = await PurchaseOrderModel.findById(purchaseOrderId).lean()
  const finPay = await PoPaymentModel.findOne({
    purchaseOrderId,
    isDeleted: false,
  }).lean()
  const fin = computePurchaseOrderFinancials(freshPo, finPay)
  const payStatus = resolvePaymentReceivedStatus(fin)
  const snapshot = buildPoSnapshotFromPo(freshPo, finPay)

  await Promise.all([
    PurchaseOrderModel.findByIdAndUpdate(purchaseOrderId, {
      $set: { paymentReceivedStatus: payStatus },
    }),
    PoPaymentModel.findOneAndUpdate(
      { purchaseOrderId, isDeleted: false },
      { $set: { poSnapshot: snapshot, snapshotAt: new Date() } }
    ),
  ])

  const full = await getPurchaseOrderById({
    purchaseOrderId,
    branchFilter,
  })
  return {
    purchaseOrder: full,
    financials: full.financials,
    poPayment: full.poPayment,
  }
}

export const appendPurchaseOrderPayment = async ({
  purchaseOrderId,
  amount,
  paidAt,
  remark = '',
  branchFilter = {},
  currentUserId: _currentUserId = null,
  isFullAccessRole: _isFullAccessRole = true,
}) => {
  const existing = await PurchaseOrderModel.findOne({
    _id: purchaseOrderId,
    isDeleted: false,
    ...branchFilter,
  }).lean()

  if (!existing) {
    throw new CustomError(
      statusCodes.notFound,
      'Purchase order not found',
      errorCodes.not_found
    )
  }

  if (String(existing.status || '') === PURCHASE_ORDER_STATUS.CLOSED) {
    throw new CustomError(
      statusCodes.badRequest,
      'Purchase order is closed',
      errorCodes.action_not_allowed
    )
  }

  const amt = Number(amount)
  if (Number.isNaN(amt) || amt <= 0) {
    throw new CustomError(
      statusCodes.badRequest,
      'amount must be a positive number',
      errorCodes.validation_error
    )
  }

  const hasPoPay = await PoPaymentModel.findOne({
    purchaseOrderId,
    isDeleted: false,
  })
    .select('_id')
    .lean()
  if (hasPoPay) {
    return appendPoPaymentLedger({
      purchaseOrderId,
      amount: amt,
      paidAt,
      remark,
      paymentProofDocumentId: null,
      branchFilter,
      currentUserId: _currentUserId,
      isFullAccessRole: _isFullAccessRole,
    })
  }

  const entry = {
    amount: amt,
    paidAt: paidAt ? new Date(paidAt) : new Date(),
    remark: String(remark || '').trim(),
  }

  const updated = await PurchaseOrderModel.findByIdAndUpdate(
    purchaseOrderId,
    { $push: { payments: entry } },
    { new: true, runValidators: true }
  )
    .populate('salesEmployeeId', 'name email phone role')
    .populate({
      path: 'products.product_id',
      select: 'name shortDescription images hsnNumber gstPercentage unit',
      populate: { path: 'images', select: 'path', model: 'document' },
    })
    .lean()

  if (updated?.products?.length) {
    for (const p of updated.products) {
      if (p.product_id && typeof p.product_id === 'object') {
        p.product_id = await transformProductImagesToSigned(p.product_id)
      }
    }
  }

  const financials = computePurchaseOrderFinancials(updated, null)
  const payStatus = resolvePaymentReceivedStatus(financials)
  await PurchaseOrderModel.findByIdAndUpdate(purchaseOrderId, {
    $set: { paymentReceivedStatus: payStatus },
  })
  updated.paymentReceivedStatus = payStatus
  return { purchaseOrder: updated, financials }
}

const sanitizeAssignedEmployeeSnapshot = (raw) => {
  if (raw == null) return null
  if (typeof raw !== 'object' || Array.isArray(raw)) return null
  const o = { ...raw }
  delete o.password
  return o
}

export const updatePurchaseOrder = async ({
  purchaseOrderId,
  products,
  companyInfo,
  industry_id,
  freightCharge,
  packingCharge,
  expectedDeliveryDate,
  expectedDeliveryWithinDays,
  remark,
  salesEmployeeId,
  assigned_employee,
  attachmentDocumentId,
  branchFilter = {},
  currentUserId: _currentUserId = null,
  isFullAccessRole: _isFullAccessRole = true,
}) => {
  const existing = await PurchaseOrderModel.findOne({
    _id: purchaseOrderId,
    isDeleted: false,
    ...branchFilter,
  }).lean()

  if (!existing) {
    throw new CustomError(
      statusCodes.notFound,
      'Purchase order not found',
      errorCodes.not_found
    )
  }

  if (String(existing.status || '') === PURCHASE_ORDER_STATUS.CLOSED) {
    throw new CustomError(
      statusCodes.badRequest,
      'Purchase order is closed and cannot be updated',
      errorCodes.action_not_allowed
    )
  }

  const updatePayload = {}
  if (companyInfo !== undefined) updatePayload.companyInfo = companyInfo
  if (industry_id !== undefined) updatePayload.industry_id = industry_id || null
  if (freightCharge !== undefined) {
    updatePayload.freightCharge =
      Number(freightCharge) >= 0 ? Number(freightCharge) : 0
  }
  if (packingCharge !== undefined) {
    updatePayload.packingCharge =
      Number(packingCharge) >= 0 ? Number(packingCharge) : 0
  }
  if (expectedDeliveryDate !== undefined)
    updatePayload.expectedDeliveryDate = expectedDeliveryDate || null
  if (expectedDeliveryWithinDays !== undefined) {
    updatePayload.expectedDeliveryWithinDays =
      expectedDeliveryWithinDays === null || expectedDeliveryWithinDays === ''
        ? null
        : Number(expectedDeliveryWithinDays) >= 0
          ? Number(expectedDeliveryWithinDays)
          : null
  }
  if (remark !== undefined) updatePayload.remark = (remark || '').trim()
  if (products !== undefined) updatePayload.products = products
  if (salesEmployeeId !== undefined) {
    const sid = salesEmployeeId && String(salesEmployeeId).trim()
    updatePayload.salesEmployeeId =
      sid && OBJECT_ID_REGEX.test(sid) ? sid : null
  }
  if (assigned_employee !== undefined) {
    updatePayload.assigned_employee = sanitizeAssignedEmployeeSnapshot(
      assigned_employee
    )
  }
  if (attachmentDocumentId !== undefined) {
    updatePayload.attachmentDocumentId =
      toAttachmentDocumentId(attachmentDocumentId)
  }

  const updated = await PurchaseOrderModel.findByIdAndUpdate(
    purchaseOrderId,
    updatePayload,
    {
      new: true,
      runValidators: true,
    }
  )
    .populate('quotationId', 'quotationCode status')
    .populate('queryId', 'queryCode status')
    .populate('industry_id', 'name location email')
    .populate('salesEmployeeId', 'name email phone role designation')
    .populate({ path: 'products.images', select: 'path' })
    .populate({
      path: 'attachmentDocumentId',
      select: 'path mimeType originalName',
      model: 'document',
    })
    .lean()

  if (updated?.products?.length) {
    for (const p of updated.products) {
      if (p.images?.length)
        p.images = await transformPathsToSignedUrls(p.images)
    }
  }

  if (
    updated?.attachmentDocumentId &&
    typeof updated.attachmentDocumentId === 'object'
  ) {
    const [signed] = await transformPathsToSignedUrls([
      updated.attachmentDocumentId,
    ])
    updated.attachmentDocumentId = signed || updated.attachmentDocumentId
  }

  if (updated) {
    const poPayUp = await PoPaymentModel.findOne({
      purchaseOrderId: updated._id,
      isDeleted: false,
    }).lean()
    updated.financials = computePurchaseOrderFinancials(updated, poPayUp)
    const payUp = resolvePaymentReceivedStatus(updated.financials)
    if (String(updated.paymentReceivedStatus || '') !== payUp) {
      await PurchaseOrderModel.findByIdAndUpdate(purchaseOrderId, {
        $set: { paymentReceivedStatus: payUp },
      })
      updated.paymentReceivedStatus = payUp
    }
    await syncPoProductsFromPurchaseOrder(updated)
    await syncPoEntryAfterPurchaseOrderLean(updated, null)
    await syncPurchaseOrderRateMaster(updated)
  }

  return updated
}

export const updatePurchaseOrderStatus = async ({
  purchaseOrderId,
  status,
  branchFilter = {},
  currentUserId: _currentUserId = null,
  isFullAccessRole: _isFullAccessRole = true,
}) => {
  const existing = await PurchaseOrderModel.findOne({
    _id: purchaseOrderId,
    isDeleted: false,
    ...branchFilter,
  }).lean()

  if (!existing) {
    throw new CustomError(
      statusCodes.notFound,
      'Purchase order not found',
      errorCodes.not_found
    )
  }

  if (String(existing.status || '') === PURCHASE_ORDER_STATUS.CLOSED) {
    throw new CustomError(
      statusCodes.badRequest,
      'Purchase order is closed',
      errorCodes.action_not_allowed
    )
  }

  const updated = await PurchaseOrderModel.findByIdAndUpdate(
    purchaseOrderId,
    { $set: { status } },
    { new: true, runValidators: true }
  )
    .populate('quotationId', 'quotationCode status')
    .populate('queryId', 'queryCode status')
    .populate('industry_id', 'name location email')
    .lean()

  return updated
}

/** Head of department: set PO status to `hod_approved` (purchase order row only). */
export const approvePurchaseOrderAsHod = async ({
  purchaseOrderId,
  branchFilter = {},
}) => {
  const existing = await PurchaseOrderModel.findOne({
    _id: purchaseOrderId,
    isDeleted: false,
    ...branchFilter,
  }).lean()

  if (!existing) {
    throw new CustomError(
      statusCodes.notFound,
      'Purchase order not found',
      errorCodes.not_found
    )
  }

  if (String(existing.status || '') === PURCHASE_ORDER_STATUS.CANCELLED) {
    throw new CustomError(
      statusCodes.badRequest,
      'Cannot approve a cancelled purchase order',
      errorCodes.action_not_allowed
    )
  }

  if (String(existing.status || '') === PURCHASE_ORDER_STATUS.CLOSED) {
    throw new CustomError(
      statusCodes.badRequest,
      'Cannot approve a closed purchase order',
      errorCodes.action_not_allowed
    )
  }

  if (String(existing.status || '') === PURCHASE_ORDER_STATUS.HOD_APPROVED) {
    return PurchaseOrderModel.findById(purchaseOrderId)
      .populate('quotationId', 'quotationCode status')
      .populate('queryId', 'queryCode status')
      .populate('industry_id', 'name location email')
      .lean()
  }

  const updated = await PurchaseOrderModel.findByIdAndUpdate(
    purchaseOrderId,
    { $set: { status: PURCHASE_ORDER_STATUS.HOD_APPROVED } },
    { new: true, runValidators: true }
  )
    .populate('quotationId', 'quotationCode status')
    .populate('queryId', 'queryCode status')
    .populate('industry_id', 'name location email')
    .lean()

  // Create payment backlog entry for the newly approved PO (fire-and-forget).
  try {
    const { createPoPaymentBacklogEntry } = await import(
      '../poPaymentBacklog/poPaymentBacklog.service.js'
    )
    const financials = computePurchaseOrderFinancials(updated, null)
    const industryData = updated?.industry_id
    const clients_snapshot = industryData
      ? {
          _id: industryData._id,
          name: industryData.name,
          location: industryData.location,
          email: industryData.email,
        }
      : updated?.companyInfo
        ? { name: updated.companyInfo.name, location: updated.companyInfo.location }
        : null

    await createPoPaymentBacklogEntry({
      purchaseOrder: updated,
      amount: financials.grandTotal,
      clients_snapshot,
    })
  } catch (err) {
    console.error('[approvePurchaseOrderAsHod] backlog creation failed:', err?.message || err)
  }

  return updated
}

/** Head of department: set PO `closed` and all `po_products` lines to `po_closed`. */
export const closePurchaseOrderAsHod = async ({
  purchaseOrderId,
  branchFilter = {},
}) => {
  const existing = await PurchaseOrderModel.findOne({
    _id: purchaseOrderId,
    isDeleted: false,
    ...branchFilter,
  }).lean()

  if (!existing) {
    throw new CustomError(
      statusCodes.notFound,
      'Purchase order not found',
      errorCodes.not_found
    )
  }

  if (String(existing.status || '') === PURCHASE_ORDER_STATUS.CANCELLED) {
    throw new CustomError(
      statusCodes.badRequest,
      'Cannot close a cancelled purchase order',
      errorCodes.action_not_allowed
    )
  }

  if (String(existing.status || '') === PURCHASE_ORDER_STATUS.CLOSED) {
    await PoProductModel.updateMany(
      {
        purchaseOrderId,
        isDeleted: false,
      },
      {
        $set: {
          status: 'po_closed',
          procurementStatus: PO_PRODUCT_PROCUREMENT_STATUS.PO_CLOSED,
        },
      }
    )
    return PurchaseOrderModel.findById(purchaseOrderId)
      .populate('quotationId', 'quotationCode status')
      .populate('queryId', 'queryCode status')
      .populate('industry_id', 'name location email')
      .lean()
  }

  await PurchaseOrderModel.findByIdAndUpdate(
    purchaseOrderId,
    { $set: { status: PURCHASE_ORDER_STATUS.CLOSED } },
    { new: true, runValidators: true }
  )

  await PoProductModel.updateMany(
    {
      purchaseOrderId,
      isDeleted: false,
    },
    {
      $set: {
        status: 'po_closed',
        procurementStatus: PO_PRODUCT_PROCUREMENT_STATUS.PO_CLOSED,
      },
    }
  )

  const updated = await PurchaseOrderModel.findById(purchaseOrderId)
    .populate('quotationId', 'quotationCode status')
    .populate('queryId', 'queryCode status')
    .populate('industry_id', 'name location email')
    .lean()

  return updated
}
