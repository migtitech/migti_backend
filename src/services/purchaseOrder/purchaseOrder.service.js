import PurchaseOrderModel, { PURCHASE_ORDER_STATUS } from '../../models/purchaseOrder.model.js'
import QuotationModel from '../../models/quotation.model.js'
import QueryModel from '../../models/query.model.js'
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

const lineTaxableAmount = (p) => {
  if (!p || p.notAvailable) return 0
  const qty = Number(p.quantity) || 0
  const rate = Number(p.rate) || 0
  let lineTotal = qty * rate
  if (p.applyDiscount && p.discountPercentage != null && !Number.isNaN(Number(p.discountPercentage))) {
    lineTotal -= lineTotal * (Number(p.discountPercentage) / 100)
  }
  return Math.max(0, lineTotal)
}

const lineGstPctForProduct = (p) => {
  if (typeof p?.gstPercentage === 'number' && !Number.isNaN(p.gstPercentage)) return p.gstPercentage
  const ref = p?.product_id && typeof p.product_id === 'object' ? p.product_id : null
  if (ref && typeof ref.gstPercentage === 'number' && !Number.isNaN(ref.gstPercentage)) return ref.gstPercentage
  return 0
}

/** Grand total (taxable + freight + packing + GST) and payment summary — matches quotation preview math */
export const computePurchaseOrderFinancials = (po) => {
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
  const payments = Array.isArray(po?.payments) ? po.payments : []
  const totalPaid = payments.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
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

const OBJECT_ID_REGEX = /^[a-fA-F0-9]{24}$/

const toImageIds = (imgs) => {
  if (!Array.isArray(imgs)) return []
  return imgs
    .map((img) => (typeof img === 'object' && img?._id ? img._id : img))
    .filter((id) => typeof id === 'string' && OBJECT_ID_REGEX.test(id))
}

const cloneProductsFromQuotation = (products = []) => {
  return products.map((p) => {
    const obj = typeof p === 'object' && p !== null ? (typeof p.toObject === 'function' ? p.toObject() : p) : {}
    return {
      productName: obj.productName || '',
      description: obj.description || '',
      quantity: obj.quantity ?? 1,
      unit: obj.unit || '',
      hsnNumber: obj.hsnNumber || '',
      modelNumber: obj.modelNumber || '',
      gstPercentage: obj.gstPercentage ?? null,
      variants: Array.isArray(obj.variants) ? obj.variants : [],
      remark: obj.remark || '',
      product_id: obj.product_id || null,
      rate: typeof obj.rate === 'number' && !Number.isNaN(obj.rate) ? obj.rate : null,
      images: toImageIds(obj.images || []),
      applyDiscount: !!obj.applyDiscount,
      discountPercentage: obj.discountPercentage ?? null,
      discountAmount: obj.discountAmount ?? null,
      notAvailable: !!obj.notAvailable,
      notAvailableRemark: obj.notAvailableRemark || '',
    }
  })
}

const assertQuotationAccess = async ({
  quotation,
  branchFilter = {},
  currentUserId = null,
  isFullAccessRole = true,
}) => {
  if (!quotation?.queryId) return
  if (currentUserId && !isFullAccessRole) {
    const sourceQuery = await QueryModel.findById(quotation.queryId).select('created_by').lean()
    const queryCreatedBy = sourceQuery?.created_by
    if (!queryCreatedBy || String(queryCreatedBy) !== String(currentUserId)) {
      throw new CustomError(
        statusCodes.forbidden,
        'You do not have access to this quotation',
        errorCodes.access_forbidden,
      )
    }
  }
}

export const createPurchaseOrderFromQuotation = async ({
  quotationId,
  branchFilter = {},
  currentUserId = null,
  isFullAccessRole = true,
  created_by = null,
  reuseExisting = true,
}) => {
  const quotation = await QuotationModel.findOne({
    _id: quotationId,
    isDeleted: false,
    ...branchFilter,
  }).lean()

  if (!quotation) {
    throw new CustomError(statusCodes.notFound, 'Quotation not found', errorCodes.not_found)
  }

  await assertQuotationAccess({ quotation, branchFilter, currentUserId, isFullAccessRole })

  if (reuseExisting) {
    const existing = await PurchaseOrderModel.findOne({
      quotationId: quotation._id,
      isDeleted: false,
    }).lean()
    if (existing) return existing
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

  return doc.toObject()
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
    throw new CustomError(statusCodes.notFound, 'Quotation not found', errorCodes.not_found)
  }

  await assertQuotationAccess({ quotation, branchFilter, currentUserId, isFullAccessRole })

  const po = await PurchaseOrderModel.findOne({
    quotationId,
    isDeleted: false,
    ...branchFilter,
  }).lean()

  return po
}

export const listPurchaseOrders = async ({
  pageNumber = 1,
  pageSize = 10,
  search = '',
  status = '',
  branchFilter = {},
  currentUserId = null,
  isFullAccessRole = true,
}) => {
  const page = Math.max(1, parseInt(pageNumber))
  const limit = Math.min(100, Math.max(1, parseInt(pageSize)))
  const skip = (page - 1) * limit

  const filter = { isDeleted: false, ...branchFilter }
  if (status && status.trim()) {
    filter.status = String(status).trim()
  }

  if (currentUserId && !isFullAccessRole) {
    const queryIds = await QueryModel.find({
      isDeleted: false,
      created_by: currentUserId,
      ...branchFilter,
    })
      .select('_id')
      .lean()
    const ids = (queryIds || []).map((q) => q._id)
    filter.queryId = { $in: ids }
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

  const purchaseOrders = rows.map((row) => ({
    ...row,
    totalAmount: computeTotalAmountFromProducts(row.products),
  }))

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
  currentUserId = null,
  isFullAccessRole = true,
}) => {
  const po = await PurchaseOrderModel.findOne({
    _id: purchaseOrderId,
    isDeleted: false,
    ...branchFilter,
  })
    .populate('quotationId', 'quotationCode status companyInfo industry_id products created_by')
    .populate('queryId', 'queryCode status companyInfo industry_id products created_by')
    .populate('industry_id', 'name location address email purchase_manager_name purchase_manager_phone')
    .populate('created_by', 'name email')
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
    .lean()

  if (!po) {
    throw new CustomError(statusCodes.notFound, 'Purchase order not found', errorCodes.not_found)
  }

  if (currentUserId && !isFullAccessRole && po.queryId) {
    const queryCreatedBy = po.queryId.created_by?._id ?? po.queryId.created_by
    const allowed = queryCreatedBy && String(queryCreatedBy) === String(currentUserId)
    if (!allowed) {
      throw new CustomError(
        statusCodes.forbidden,
        'You do not have access to this purchase order',
        errorCodes.access_forbidden,
      )
    }
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

  if (po.branchId) {
    const branch = await CompanyBranchModel.findById(po.branchId).select('signature').lean()
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

  po.financials = computePurchaseOrderFinancials(po)

  return po
}

export const appendPurchaseOrderPayment = async ({
  purchaseOrderId,
  amount,
  paidAt,
  remark = '',
  branchFilter = {},
  currentUserId = null,
  isFullAccessRole = true,
}) => {
  const existing = await PurchaseOrderModel.findOne({
    _id: purchaseOrderId,
    isDeleted: false,
    ...branchFilter,
  }).lean()

  if (!existing) {
    throw new CustomError(statusCodes.notFound, 'Purchase order not found', errorCodes.not_found)
  }

  if (currentUserId && !isFullAccessRole && existing.queryId) {
    const sourceQuery = await QueryModel.findById(existing.queryId).select('created_by').lean()
    const queryCreatedBy = sourceQuery?.created_by
    if (!queryCreatedBy || String(queryCreatedBy) !== String(currentUserId)) {
      throw new CustomError(
        statusCodes.forbidden,
        'You do not have access to this purchase order',
        errorCodes.access_forbidden,
      )
    }
  }

  const amt = Number(amount)
  if (Number.isNaN(amt) || amt <= 0) {
    throw new CustomError(statusCodes.badRequest, 'amount must be a positive number', errorCodes.validation_error)
  }

  const entry = {
    amount: amt,
    paidAt: paidAt ? new Date(paidAt) : new Date(),
    remark: String(remark || '').trim(),
  }

  const updated = await PurchaseOrderModel.findByIdAndUpdate(
    purchaseOrderId,
    { $push: { payments: entry } },
    { new: true, runValidators: true },
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

  const financials = computePurchaseOrderFinancials(updated)
  return { purchaseOrder: updated, financials }
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
  branchFilter = {},
  currentUserId = null,
  isFullAccessRole = true,
}) => {
  const existing = await PurchaseOrderModel.findOne({
    _id: purchaseOrderId,
    isDeleted: false,
    ...branchFilter,
  }).lean()

  if (!existing) {
    throw new CustomError(statusCodes.notFound, 'Purchase order not found', errorCodes.not_found)
  }

  if (currentUserId && !isFullAccessRole && existing.queryId) {
    const sourceQuery = await QueryModel.findById(existing.queryId).select('created_by').lean()
    const queryCreatedBy = sourceQuery?.created_by
    if (!queryCreatedBy || String(queryCreatedBy) !== String(currentUserId)) {
      throw new CustomError(
        statusCodes.forbidden,
        'You do not have access to this purchase order',
        errorCodes.access_forbidden,
      )
    }
  }

  const updatePayload = {}
  if (companyInfo !== undefined) updatePayload.companyInfo = companyInfo
  if (industry_id !== undefined) updatePayload.industry_id = industry_id || null
  if (freightCharge !== undefined) {
    updatePayload.freightCharge = Number(freightCharge) >= 0 ? Number(freightCharge) : 0
  }
  if (packingCharge !== undefined) {
    updatePayload.packingCharge = Number(packingCharge) >= 0 ? Number(packingCharge) : 0
  }
  if (expectedDeliveryDate !== undefined) updatePayload.expectedDeliveryDate = expectedDeliveryDate || null
  if (expectedDeliveryWithinDays !== undefined) {
    updatePayload.expectedDeliveryWithinDays =
      expectedDeliveryWithinDays === null || expectedDeliveryWithinDays === ''
        ? null
        : (Number(expectedDeliveryWithinDays) >= 0 ? Number(expectedDeliveryWithinDays) : null)
  }
  if (remark !== undefined) updatePayload.remark = (remark || '').trim()
  if (products !== undefined) updatePayload.products = products
  if (salesEmployeeId !== undefined) {
    const sid = salesEmployeeId && String(salesEmployeeId).trim()
    updatePayload.salesEmployeeId =
      sid && OBJECT_ID_REGEX.test(sid) ? sid : null
  }

  const updated = await PurchaseOrderModel.findByIdAndUpdate(purchaseOrderId, updatePayload, {
    new: true,
    runValidators: true,
  })
    .populate('quotationId', 'quotationCode status')
    .populate('queryId', 'queryCode status')
    .populate('industry_id', 'name location email')
    .populate('salesEmployeeId', 'name email phone role designation')
    .populate({ path: 'products.images', select: 'path' })
    .lean()

  if (updated?.products?.length) {
    for (const p of updated.products) {
      if (p.images?.length) p.images = await transformPathsToSignedUrls(p.images)
    }
  }

  if (updated) {
    updated.financials = computePurchaseOrderFinancials(updated)
  }

  return updated
}

export const updatePurchaseOrderStatus = async ({
  purchaseOrderId,
  status,
  branchFilter = {},
  currentUserId = null,
  isFullAccessRole = true,
}) => {
  const existing = await PurchaseOrderModel.findOne({
    _id: purchaseOrderId,
    isDeleted: false,
    ...branchFilter,
  }).lean()

  if (!existing) {
    throw new CustomError(statusCodes.notFound, 'Purchase order not found', errorCodes.not_found)
  }

  if (currentUserId && !isFullAccessRole && existing.queryId) {
    const sourceQuery = await QueryModel.findById(existing.queryId).select('created_by').lean()
    const queryCreatedBy = sourceQuery?.created_by
    if (!queryCreatedBy || String(queryCreatedBy) !== String(currentUserId)) {
      throw new CustomError(
        statusCodes.forbidden,
        'You do not have access to this purchase order',
        errorCodes.access_forbidden,
      )
    }
  }

  const updated = await PurchaseOrderModel.findByIdAndUpdate(
    purchaseOrderId,
    { $set: { status } },
    { new: true, runValidators: true },
  )
    .populate('quotationId', 'quotationCode status')
    .populate('queryId', 'queryCode status')
    .populate('industry_id', 'name location email')
    .lean()

  return updated
}
