import mongoose from 'mongoose'
import QuotationModel, { QUOTATION_STATUS } from '../../models/quotation.model.js'
import QuotationSnapshotModel from '../../models/quotationSnapshot.model.js'
import QueryModel from '../../models/query.model.js'
import CustomError from '../../utils/exception.js'
import { getNextSequence } from '../codeSequence/codeSequence.service.js'
import { statusCodes, errorCodes } from '../../core/common/constant.js'
import {
  transformProductImagesToSigned,
  transformPathsToSignedUrls,
} from '../document/document.service.js'
import { upsertQuotedRatesForQuotation } from '../quotedProductRate/quotedProductRate.service.js'
import { autoAssignPurchaseTasksForQuotation } from '../purchaseTask/purchaseTask.service.js'
import CompanyBranchModel from '../../models/companyBranch.model.js'
import { getDocumentById, toDisplayPath } from '../document/document.service.js'
import { captureRateLogsForProductChanges } from '../rateLog/rateLog.service.js'
import {
  resolveQueryAccessFilter,
  findVisibleQueryById,
  getTerritoryIndustryIdsForUser,
} from '../../core/helpers/queryAccess.js'

const QUOTATION_CODE_PREFIX = 'QUO'
const normalizeRole = (role) => String(role || '').trim().toLowerCase().replace(/[\s-]+/g, '_')
const isBackOfficeRole = (role) => {
  const normalized = normalizeRole(role)
  if (['back_office_exicutive', 'back_office_executive', 'boe'].includes(normalized)) return true
  return normalized.replace(/_/g, '').includes('backoffice')
}

/** Persist quotation ref on the source query (deduped by quotationId). */
export const appendConvertedQuotationOnQuery = async (queryId, quotationId, quotationCode = '') => {
  if (!queryId || !quotationId) return
  await QueryModel.updateOne(
    {
      _id: queryId,
      convertedQuotations: { $not: { $elemMatch: { quotationId } } },
    },
    {
      $push: {
        convertedQuotations: {
          quotationId,
          quotationCode: String(quotationCode || '').trim(),
        },
      },
    },
  )
}

/** Company name to first 5 chars (alphanumeric, uppercase). Fallback if empty. */
const companyFirst5 = (name) => {
  const s = (name || '')
    .toString()
    .replace(/\s+/g, '')
    .replace(/[^A-Za-z0-9]/g, '')
    .toUpperCase()
    .slice(0, 5)
  return s || 'NA'
}

/** Quotation code format: COMPANYFIRST5-QTO-MIG-IND-DD-MM-QUOTATIONCODE (company first, rest same) */
const formatQuotationCode = (numericCode, companyName) => {
  const now = new Date()
  const DD = String(now.getDate()).padStart(2, '0')
  const MM = String(now.getMonth() + 1).padStart(2, '0')
  return `${companyFirst5(companyName)}-QTO-MIG-IND-${DD}-${MM}-${numericCode}`
}

/**
 * Compute quotation status from product lines (rate submission).
 * Only used when current status is draft / partial / fulfilled (auto flow).
 */
export const computeStatusFromProducts = (products = []) => {
  if (!products.length) return QUOTATION_STATUS.DRAFT
  const withRate = products.filter(
    (p) => !p.notAvailable && typeof p.rate === 'number' && p.rate >= 0,
  ).length
  const totalLines = products.filter((p) => !p.notAvailable).length
  if (totalLines === 0 || withRate === 0) return QUOTATION_STATUS.DRAFT
  if (withRate < totalLines) return QUOTATION_STATUS.PARTIAL
  return QUOTATION_STATUS.FULFILLED
}

const STATUSES_AUTO_UPDATED = [
  QUOTATION_STATUS.DRAFT,
  QUOTATION_STATUS.PARTIAL,
  QUOTATION_STATUS.FULFILLED,
]

const toRefId = (val) => {
  if (val == null || val === '') return null
  if (typeof val === 'object' && val !== null && val._id != null) return val._id
  return val
}

const buildQuotationSnapshotPayload = (doc) => {
  if (!doc) return {}
  const products = Array.isArray(doc.products)
    ? doc.products.map((p) => ({
      productName: p.productName,
      description: p.description ?? '',
      quantity: p.quantity,
      unit: p.unit ?? '',
      hsnNumber: p.hsnNumber ?? '',
      modelNumber: p.modelNumber ?? '',
      gstPercentage: p.gstPercentage ?? null,
      variants: Array.isArray(p.variants)
        ? p.variants.map((v) => ({
          _id: v._id,
          variantName: v.variantName || '',
        }))
        : [],
      remark: p.remark ?? '',
      product_id: toRefId(p.product_id),
      rate: p.rate ?? null,
      images: (Array.isArray(p.images) ? p.images : []).map((img) => toRefId(img)).filter(Boolean),
      applyDiscount: !!p.applyDiscount,
      discountPercentage: p.discountPercentage ?? null,
      discountAmount: p.discountAmount ?? null,
      notAvailable: !!p.notAvailable,
      notAvailableRemark: p.notAvailableRemark || '',
    }))
    : []

  return {
    uniqueId: doc.uniqueId,
    quotationCode: doc.quotationCode,
    queryId: toRefId(doc.queryId),
    status: doc.status,
    companyInfo: doc.companyInfo ? JSON.parse(JSON.stringify(doc.companyInfo)) : {},
    industry_id: toRefId(doc.industry_id),
    products,
    remark: doc.remark ?? '',
    freightCharge: doc.freightCharge ?? '',
    packingCharge: doc.packingCharge ?? 0,
    expectedDeliveryDate: doc.expectedDeliveryDate ?? null,
    expectedDeliveryWithinDays: doc.expectedDeliveryWithinDays ?? null,
    branchId: toRefId(doc.branchId),
    created_by: toRefId(doc.created_by),
  }
}

const createQuotationSnapshotOnHodApproval = async ({ quotationLean, approvedBy = null }) => {
  const quotationId = quotationLean._id
  const baseCode = String(quotationLean.quotationCode || '').trim().toUpperCase()
  if (!baseCode) {
    throw new CustomError(
      statusCodes.badRequest,
      'Quotation code is required before HOD approval snapshot',
      errorCodes.bad_request,
    )
  }
  const count = await QuotationSnapshotModel.countDocuments({ quotationId })
  const revision = count + 1
  const snapshotCode = `${baseCode}R${revision}`
  const payload = buildQuotationSnapshotPayload(quotationLean)

  await QuotationSnapshotModel.create({
    quotationId,
    revision,
    snapshotCode,
    payload,
    approvedBy: approvedBy || null,
  })
}

/** Compute total amount from products: sum of (quantity * rate - discount) for each line; excludes notAvailable */
export const computeTotalAmountFromProducts = (products = []) => {
  if (!Array.isArray(products) || !products.length) return 0
  return products.reduce((sum, p) => {
    if (p.notAvailable) return sum
    const qty = Number(p.quantity)
    const rate = Number(p.rate)
    if (Number.isNaN(qty) || Number.isNaN(rate) || qty < 0 || rate < 0) return sum
    let lineTotal = qty * rate
    if (p.applyDiscount && p.discountPercentage != null) {
      const discountAmt = lineTotal * (Number(p.discountPercentage) / 100)
      lineTotal = Math.max(0, lineTotal - discountAmt)
    }
    return sum + lineTotal
  }, 0)
}

/**
 * Create a quotation from an existing query (snapshot products + companyInfo).
 * Called when converting query to quotation.
 * @param {Object} options
 * @param {string} options.queryId
 * @param {string} [options.remark]
 * @param {Array} [options.productsOverride] - If provided, use instead of query.products
 */
export const createQuotationFromQuery = async ({
  queryId,
  created_by,
  branchId,
  branchFilter = {},
  remark = '',
  productsOverride,
  reuseExisting = true,
}) => {
  const query = await QueryModel.findOne({
    _id: queryId,
    isDeleted: false,
    ...branchFilter,
  }).lean()

  if (!query) {
    throw new CustomError(
      statusCodes.notFound,
      'Query not found',
      errorCodes.not_found,
    )
  }

  if (reuseExisting) {
    const existingQuotation = await QuotationModel.findOne({
      queryId: query._id,
      isDeleted: false,
      ...(branchId ? { branchId } : {}),
    }).lean()

    if (existingQuotation) {
      return existingQuotation
    }
  }

  const quotationBranchFilter = branchId ? { branchId } : {}
  const numericCode = await getNextSequence('quotationCode')
  const companyName = query.companyInfo?.name
  const quotationCode = formatQuotationCode(numericCode, companyName)

  const OBJECT_ID_REGEX = /^[a-fA-F0-9]{24}$/
  const toImageIds = (imgs) => {
    if (!Array.isArray(imgs)) return []
    return imgs
      .map((img) => (typeof img === 'object' && img?._id ? img._id : img))
      .filter((id) => typeof id === 'string' && OBJECT_ID_REGEX.test(id))
  }

  const baseProducts = Array.isArray(productsOverride) ? productsOverride : (query.products || [])
  const products = baseProducts.map((p) => {
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
      rate: null,
      images: toImageIds(obj.images || []),
    }
  })

  const doc = await QuotationModel.create({
    quotationCode,
    queryId: query._id,
    status: QUOTATION_STATUS.DRAFT,
    companyInfo: query.companyInfo || {},
    industry_id: query.industry_id || null,
    products,
    remark: (remark || '').trim(),
    created_by: created_by || null,
    branchId: branchId || query.branchId || null,
    freightCharge: '',
    packingCharge: 0,
    expectedDeliveryDate: null,
    expectedDeliveryWithinDays: null,
  })

  const created = doc.toObject()

  // Automatically assign purchase tasks based on product categories & employee categories.
  // Errors are swallowed inside the helper to avoid impacting quotation creation.
  await autoAssignPurchaseTasksForQuotation({
    quotation: created,
    branchId: created.branchId || branchId || null,
    assignedBy: created_by || null,
  })

  return created
}

const startOfUtcDay = (yyyyMmDd) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(yyyyMmDd || '').trim())
  if (!m) return null
  return new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00.000Z`)
}

const endOfUtcDay = (yyyyMmDd) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(yyyyMmDd || '').trim())
  if (!m) return null
  return new Date(`${m[1]}-${m[2]}-${m[3]}T23:59:59.999Z`)
}

export const listQuotations = async ({
  pageNumber = 1,
  pageSize = 10,
  search = '',
  status = '',
  dateFrom = '',
  dateTo = '',
  industryId = '',
  includeTotalAmountSum = false,
  branchFilter = {},
  currentUserId = null,
  isFullAccessRole = true,
  role = '',
}) => {
  const page = Math.max(1, parseInt(pageNumber))
  const limit = Math.min(100, Math.max(1, parseInt(pageSize)))
  const skip = (page - 1) * limit

  const wantTotalAmountSum =
    includeTotalAmountSum === true
    || includeTotalAmountSum === 'true'
    || includeTotalAmountSum === '1'

  const filter = { isDeleted: false, ...branchFilter }
  if (industryId && String(industryId).trim() && mongoose.Types.ObjectId.isValid(industryId)) {
    filter.industry_id = new mongoose.Types.ObjectId(String(industryId).trim())
  }
  const normalizeStatusFilter = (rawStatus = '') => {
    const val = String(rawStatus || '').trim().toLowerCase()
    if (!val) return ''
    if (val === 'drafted') return QUOTATION_STATUS.DRAFT
    if (val === 'hod approved' || val === 'hod-approved') return QUOTATION_STATUS.HOD_APPROVED
    return val
  }
  if (status && status.trim()) {
    filter.status = normalizeStatusFilter(status)
  }

  let fromD = dateFrom && String(dateFrom).trim() ? startOfUtcDay(dateFrom) : null
  let toD = dateTo && String(dateTo).trim() ? endOfUtcDay(dateTo) : null
  if (fromD && toD && fromD > toD) {
    throw new CustomError(
      statusCodes.badRequest,
      'dateFrom must be on or before dateTo',
      errorCodes.bad_request,
    )
  }
  if (fromD || toD) {
    filter.createdAt = {}
    if (fromD) filter.createdAt.$gte = fromD
    if (toD) filter.createdAt.$lte = toD
  }

  // For employees (non-admin): zone-assigned users see quotations by client (industry) territory; others by accessible queries.
  if (currentUserId && !isFullAccessRole) {
    const territoryIds = await getTerritoryIndustryIdsForUser({
      currentUserId,
      isFullAccessRole: false,
      branchFilter,
    })
    if (territoryIds != null) {
      filter.industry_id = { $in: territoryIds }
    } else {
      const accessFilter = await resolveQueryAccessFilter({
        currentUserId,
        isFullAccessRole: false,
        role,
        branchFilter,
      })
      const queryIds = await QueryModel.find({
        isDeleted: false,
        ...branchFilter,
        ...accessFilter,
      })
        .select('_id')
        .lean()
      const ids = (queryIds || []).map((q) => q._id)
      filter.queryId = { $in: ids }
    }
  }

  if (search && search.trim()) {
    const term = search.trim()
    filter.$or = [
      { quotationCode: { $regex: term, $options: 'i' } },
      { 'companyInfo.name': { $regex: term, $options: 'i' } },
      { 'companyInfo.location': { $regex: term, $options: 'i' } },
      { 'products.productName': { $regex: term, $options: 'i' } },
    ]
  }

  let totalAmountSum
  if (
    wantTotalAmountSum
    && industryId
    && String(industryId).trim()
    && mongoose.Types.ObjectId.isValid(industryId)
  ) {
    const forSum = await QuotationModel.find(filter).select('products').lean()
    totalAmountSum = forSum.reduce(
      (sum, q) => sum + computeTotalAmountFromProducts(q.products),
      0,
    )
  }

  const totalItems = await QuotationModel.countDocuments(filter)

  const quotations = await QuotationModel.find(filter)
    .populate('queryId', 'queryCode status')
    .populate('industry_id', 'name location email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()

  const totalPages = Math.ceil(totalItems / limit)

  const quotationsWithTotal = quotations.map((q) => ({
    ...q,
    totalAmount: computeTotalAmountFromProducts(q.products),
  }))

  return {
    quotations: quotationsWithTotal,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
    ...(totalAmountSum !== undefined && { totalAmountSum }),
  }
}

export const getQuotationById = async ({
  quotationId,
  branchFilter = {},
  currentUserId = null,
  isFullAccessRole = true,
  role = '',
}) => {
  const quotation = await QuotationModel.findOne({
    _id: quotationId,
    isDeleted: false,
    ...branchFilter,
  })
    .populate('queryId', 'queryCode status companyInfo industry_id products created_by')
    .populate('industry_id', 'name location address email purchase_manager_name purchase_manager_phone gstNumber')
    .populate('created_by', 'name email')
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

  if (!quotation) {
    throw new CustomError(
      statusCodes.notFound,
      'Quotation not found',
      errorCodes.not_found,
    )
  }

  // Employees may only view quotations for queries they may access
  if (currentUserId && !isFullAccessRole && quotation.queryId) {
    const qid = typeof quotation.queryId === 'object' ? quotation.queryId._id : quotation.queryId
    const visible = await findVisibleQueryById({
      queryId: qid,
      branchFilter,
      currentUserId,
      isFullAccessRole,
      role,
      select: '_id',
    })
    if (!visible) {
      throw new CustomError(
        statusCodes.forbidden,
        'You do not have access to this quotation',
        errorCodes.access_forbidden,
      )
    }
  }

  // Transform product images (master + snapshot) to signed URLs for S3 (same as query)
  if (quotation.products?.length) {
    for (const p of quotation.products) {
      if (p.product_id && typeof p.product_id === 'object') {
        p.product_id = await transformProductImagesToSigned(p.product_id)
      }
      if (Array.isArray(p.images) && p.images.length) {
        p.images = await transformPathsToSignedUrls(p.images)
      }
    }
  }

  // Attach branch signature (if configured) for quotation preview.
  if (quotation.branchId) {
    const branch = await CompanyBranchModel.findById(quotation.branchId)
      .select('signature')
      .lean()
    const signatureId = branch?.signature ? String(branch.signature) : ''
    if (signatureId) {
      const signatureDoc = await getDocumentById(signatureId)
      if (signatureDoc?._id && signatureDoc?.path) {
        quotation.branchSignature = {
          _id: signatureDoc._id,
          path: await toDisplayPath(signatureDoc.path),
        }
      }
    }
  }

  return quotation
}

/**
 * List HOD approval snapshots for a quotation (newest revision first).
 */
export const listQuotationSnapshots = async ({
  quotationId,
  branchFilter = {},
  currentUserId = null,
  isFullAccessRole = true,
  role = '',
}) => {
  const existing = await QuotationModel.findOne({
    _id: quotationId,
    isDeleted: false,
    ...branchFilter,
  }).lean()

  if (!existing) {
    throw new CustomError(
      statusCodes.notFound,
      'Quotation not found',
      errorCodes.not_found,
    )
  }

  if (currentUserId && !isFullAccessRole && existing.queryId) {
    const visible = await findVisibleQueryById({
      queryId: existing.queryId,
      branchFilter,
      currentUserId,
      isFullAccessRole,
      role,
      select: '_id',
    })
    if (!visible) {
      throw new CustomError(
        statusCodes.forbidden,
        'You do not have access to this quotation',
        errorCodes.access_forbidden,
      )
    }
  }

  const snapshots = await QuotationSnapshotModel.find({ quotationId: existing._id })
    .sort({ revision: -1 })
    .select('revision snapshotCode payload createdAt approvedBy')
    .lean()

  return { snapshots }
}

/**
 * Update quotation (products/rates). Recomputes status to partial/fulfilled when
 * current status is draft/partial/fulfilled.
 */
export const updateQuotation = async ({
  quotationId,
  products,
  companyInfo,
  industry_id,
  freightCharge,
  packingCharge,
  expectedDeliveryDate,
  expectedDeliveryWithinDays,
  branchFilter = {},
  currentUserId = null,
  isFullAccessRole = true,
  role = '',
}) => {
  const existing = await QuotationModel.findOne({
    _id: quotationId,
    isDeleted: false,
    ...branchFilter,
  }).lean()

  if (!existing) {
    throw new CustomError(
      statusCodes.notFound,
      'Quotation not found',
      errorCodes.not_found,
    )
  }
  if (currentUserId && !isFullAccessRole && existing.queryId) {
    const visible = await findVisibleQueryById({
      queryId: existing.queryId,
      branchFilter,
      currentUserId,
      isFullAccessRole,
      role,
      select: '_id',
    })
    if (!visible) {
      throw new CustomError(
        statusCodes.forbidden,
        'You do not have access to this quotation',
        errorCodes.access_forbidden,
      )
    }
  }

  const updatePayload = {}
  if (companyInfo !== undefined) updatePayload.companyInfo = companyInfo
  if (industry_id !== undefined) updatePayload.industry_id = industry_id || null
  if (freightCharge !== undefined) {
    updatePayload.freightCharge =
      freightCharge == null ? '' : String(freightCharge).trim()
  }
  if (packingCharge !== undefined) updatePayload.packingCharge = Number(packingCharge) >= 0 ? Number(packingCharge) : 0
  if (expectedDeliveryDate !== undefined) updatePayload.expectedDeliveryDate = expectedDeliveryDate || null
  if (expectedDeliveryWithinDays !== undefined) {
    updatePayload.expectedDeliveryWithinDays =
      expectedDeliveryWithinDays === null || expectedDeliveryWithinDays === ''
        ? null
        : (Number(expectedDeliveryWithinDays) >= 0
            ? Number(expectedDeliveryWithinDays)
            : null)
  }
  if (products !== undefined) {
    updatePayload.products = products
    if (STATUSES_AUTO_UPDATED.includes(existing.status)) {
      updatePayload.status = computeStatusFromProducts(products)
    }
  }

  if (
    existing.status === QUOTATION_STATUS.HOD_APPROVED
    && Object.keys(updatePayload).length > 0
  ) {
    const effectiveProducts = products !== undefined ? products : existing.products
    updatePayload.status = computeStatusFromProducts(effectiveProducts || [])
  }

  const updated = await QuotationModel.findByIdAndUpdate(
    quotationId,
    updatePayload,
    { new: true, runValidators: true },
  )
    .populate('queryId', 'queryCode status')
    .populate('industry_id', 'name location email')
    .populate({ path: 'products.images', select: 'path' })
    .lean()

  if (updated?.products?.length) {
    for (const p of updated.products) {
      if (p.images?.length) p.images = await transformPathsToSignedUrls(p.images)
    }
  }
  if (products !== undefined) {
    try {
      await captureRateLogsForProductChanges({
        previousProducts: existing?.products || [],
        updatedProducts: updated?.products || [],
        quotationId: updated?._id || quotationId,
        industry_id: updated?.industry_id || existing?.industry_id || null,
        created_by: currentUserId || null,
        branchId: updated?.branchId || existing?.branchId || null,
      })
    } catch (err) {
      console.error('Failed to capture rate logs:', err?.message || err)
    }
  }
  // Snapshot quoted rates whenever products are updated
  await upsertQuotedRatesForQuotation({ quotation: updated })
  return updated
}

/**
 * Update quotation status (HOD manual: ready, sentToClient, poReceived, followup01, followup02, closed).
 */
export const updateQuotationStatus = async ({
  quotationId,
  status,
  branchFilter = {},
  currentUserId = null,
  currentUserRole = '',
  isFullAccessRole = true,
  approvedBy = null,
  role = '',
}) => {
  const existing = await QuotationModel.findOne({
    _id: quotationId,
    isDeleted: false,
    ...branchFilter,
  }).lean()

  if (!existing) {
    throw new CustomError(
      statusCodes.notFound,
      'Quotation not found',
      errorCodes.not_found,
    )
  }
  if (currentUserId && !isFullAccessRole && existing.queryId) {
    const visible = await findVisibleQueryById({
      queryId: existing.queryId,
      branchFilter,
      currentUserId,
      isFullAccessRole,
      role,
      select: '_id',
    })
    if (!visible) {
      throw new CustomError(
        statusCodes.forbidden,
        'You do not have access to this quotation',
        errorCodes.access_forbidden,
      )
    }
  }

  if (isBackOfficeRole(currentUserRole) && status === QUOTATION_STATUS.HOD_APPROVED) {
    throw new CustomError(
      statusCodes.forbidden,
      'Back office role cannot approve quotations',
      errorCodes.access_forbidden,
    )
  }

  if (
    status === QUOTATION_STATUS.HOD_APPROVED
    && existing.status !== QUOTATION_STATUS.HOD_APPROVED
  ) {
    const code = String(existing.quotationCode || '').trim()
    if (!code) {
      throw new CustomError(
        statusCodes.badRequest,
        'Quotation code is required before HOD approval',
        errorCodes.bad_request,
      )
    }
  }

  const previousStatus = existing.status

  const updated = await QuotationModel.findByIdAndUpdate(
    quotationId,
    { $set: { status } },
    { new: true, runValidators: true },
  )
    .populate('queryId', 'queryCode status')
    .populate('industry_id', 'name location email')
    .lean()

  if (
    status === QUOTATION_STATUS.HOD_APPROVED
    && previousStatus !== QUOTATION_STATUS.HOD_APPROVED
  ) {
    try {
      await createQuotationSnapshotOnHodApproval({
        quotationLean: updated,
        approvedBy: approvedBy || null,
      })
    } catch (err) {
      await QuotationModel.findByIdAndUpdate(
        quotationId,
        { $set: { status: previousStatus } },
        { new: true, runValidators: true },
      )
      if (err instanceof CustomError) throw err
      throw new CustomError(
        statusCodes.internalServerError,
        `Failed to save quotation snapshot: ${err?.message || 'unknown error'}`,
        errorCodes.internal_error,
      )
    }
  }

  return updated
}

export const getQuotationByQueryId = async ({
  queryId,
  branchFilter = {},
  currentUserId = null,
  isFullAccessRole = true,
  role = '',
}) => {
  if (currentUserId && !isFullAccessRole) {
    const accessFilter = await resolveQueryAccessFilter({
      currentUserId,
      isFullAccessRole: false,
      role,
      branchFilter,
    })
    const sourceQuery = await QueryModel.findOne({
      _id: queryId,
      isDeleted: false,
      ...branchFilter,
      ...accessFilter,
    })
      .select('_id')
      .lean()
    if (!sourceQuery) return null
  }
  const quotation = await QuotationModel.findOne({
    queryId,
    isDeleted: false,
    ...branchFilter,
  })
    .populate('queryId', 'queryCode status')
    .populate('industry_id', 'name location email')
    .lean()

  return quotation || null
}

export const deleteQuotation = async ({ quotationId, branchFilter = {} }) => {
  const existing = await QuotationModel.findOne({
    _id: quotationId,
    isDeleted: false,
    ...branchFilter,
  }).lean()

  if (!existing) {
    throw new CustomError(
      statusCodes.notFound,
      'Quotation not found',
      errorCodes.not_found,
    )
  }

  await QuotationModel.findByIdAndUpdate(quotationId, { isDeleted: true }, { new: true })

  if (existing.queryId) {
    await QueryModel.updateOne(
      { _id: existing.queryId },
      { $pull: { convertedQuotations: { quotationId: existing._id } } },
    )
  }

  return {
    deletedQuotation: {
      id: existing._id,
      quotationCode: existing.quotationCode,
      deletedAt: new Date().toISOString(),
    },
  }
}
