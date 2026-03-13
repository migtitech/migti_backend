import QuotationModel, { QUOTATION_STATUS } from '../../models/quotation.model.js'
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

const QUOTATION_CODE_PREFIX = 'QUO'

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

/** Quotation code format: QTO-MIG-IND-DD-MM-QUOTATIONCODE-COMPANYFIRST5CHAR */
const formatQuotationCode = (numericCode, companyName) => {
  const now = new Date()
  const DD = String(now.getDate()).padStart(2, '0')
  const MM = String(now.getMonth() + 1).padStart(2, '0')
  return `QTO-MIG-IND-${DD}-${MM}-${numericCode}-${companyFirst5(companyName)}`
}

/**
 * Compute quotation status from product lines (rate submission).
 * Only used when current status is draft / partial / fulfilled (auto flow).
 */
export const computeStatusFromProducts = (products = []) => {
  if (!products.length) return QUOTATION_STATUS.DRAFT
  const withRate = products.filter(
    (p) => typeof p.rate === 'number' && p.rate >= 0,
  ).length
  if (withRate === 0) return QUOTATION_STATUS.DRAFT
  if (withRate < products.length) return QUOTATION_STATUS.PARTIAL
  return QUOTATION_STATUS.FULFILLED
}

const STATUSES_AUTO_UPDATED = [
  QUOTATION_STATUS.DRAFT,
  QUOTATION_STATUS.PARTIAL,
  QUOTATION_STATUS.FULFILLED,
]

/** Compute total amount from products: sum of (quantity * rate) for each line */
export const computeTotalAmountFromProducts = (products = []) => {
  if (!Array.isArray(products) || !products.length) return 0
  return products.reduce((sum, p) => {
    const qty = Number(p.quantity)
    const rate = Number(p.rate)
    if (Number.isNaN(qty) || Number.isNaN(rate) || qty < 0 || rate < 0) return sum
    return sum + qty * rate
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

  const existingQuotation = await QuotationModel.findOne({
    queryId: query._id,
    isDeleted: false,
    ...(branchId ? { branchId } : {}),
  }).lean()

  if (existingQuotation) {
    return existingQuotation
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
    freightCharge: 0,
    packingCharge: 0,
    expectedDeliveryDate: null,
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

export const listQuotations = async ({
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
    filter.status = status.trim()
  }

  // For employees (non-admin): show only quotations that came from queries they created
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
      { quotationCode: { $regex: term, $options: 'i' } },
      { 'companyInfo.name': { $regex: term, $options: 'i' } },
      { 'companyInfo.location': { $regex: term, $options: 'i' } },
      { 'products.productName': { $regex: term, $options: 'i' } },
    ]
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
  }
}

export const getQuotationById = async ({
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
    .populate('queryId', 'queryCode status companyInfo industry_id products created_by')
    .populate('industry_id', 'name location address email purchase_manager_name purchase_manager_phone')
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

  // Employees may only view quotations that came from their own queries
  if (currentUserId && !isFullAccessRole && quotation.queryId) {
    const queryCreatedBy = quotation.queryId.created_by?._id ?? quotation.queryId.created_by
    const allowed = queryCreatedBy && String(queryCreatedBy) === String(currentUserId)
    if (!allowed) {
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

  return quotation
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
  branchFilter = {},
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

  const updatePayload = {}
  if (companyInfo !== undefined) updatePayload.companyInfo = companyInfo
  if (industry_id !== undefined) updatePayload.industry_id = industry_id || null
  if (freightCharge !== undefined) updatePayload.freightCharge = Number(freightCharge) >= 0 ? Number(freightCharge) : 0
  if (packingCharge !== undefined) updatePayload.packingCharge = Number(packingCharge) >= 0 ? Number(packingCharge) : 0
  if (expectedDeliveryDate !== undefined) updatePayload.expectedDeliveryDate = expectedDeliveryDate || null
  if (products !== undefined) {
    updatePayload.products = products
    if (STATUSES_AUTO_UPDATED.includes(existing.status)) {
      updatePayload.status = computeStatusFromProducts(products)
    }
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

  const updated = await QuotationModel.findByIdAndUpdate(
    quotationId,
    { $set: { status } },
    { new: true, runValidators: true },
  )
    .populate('queryId', 'queryCode status')
    .populate('industry_id', 'name location email')
    .lean()

  return updated
}

export const getQuotationByQueryId = async ({ queryId, branchFilter = {} }) => {
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
