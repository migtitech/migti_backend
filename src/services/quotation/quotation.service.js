import QuotationModel, { QUOTATION_STATUS } from '../../models/quotation.model.js'
import QueryModel from '../../models/query.model.js'
import CustomError from '../../utils/exception.js'
import { statusCodes, errorCodes } from '../../core/common/constant.js'

const QUOTATION_CODE_PREFIX = 'QUO'

const generateQuotationCode = () => {
  const num = Math.floor(10000 + Math.random() * 90000)
  return `${QUOTATION_CODE_PREFIX}0${num}`
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

/**
 * Create a quotation from an existing query (snapshot products + companyInfo).
 * Called when converting query to quotation.
 */
export const createQuotationFromQuery = async ({
  queryId,
  created_by,
  branchId,
  branchFilter = {},
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

  const baseFilter = { isDeleted: false }
  if (branchId) baseFilter.branchId = branchId

  let quotationCode = ''
  const maxAttempts = 20
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const candidate = generateQuotationCode()
    const exists = await QuotationModel.findOne({
      ...baseFilter,
      quotationCode: candidate,
    }).lean()
    if (!exists) {
      quotationCode = candidate
      break
    }
  }

  if (!quotationCode) {
    throw new CustomError(
      statusCodes.conflict,
      'Could not generate unique quotation code. Please try again.',
      errorCodes.already_exist,
    )
  }

  const products = (query.products || []).map((p) => ({
    ...(typeof p.toObject === 'function' ? p.toObject() : p),
    rate: null,
  }))

  const doc = await QuotationModel.create({
    quotationCode,
    queryId: query._id,
    status: QUOTATION_STATUS.DRAFT,
    companyInfo: query.companyInfo || {},
    industry_id: query.industry_id || null,
    products,
    created_by: created_by || null,
    branchId: branchId || query.branchId || null,
  })

  return doc.toObject()
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

  return {
    quotations,
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
    .lean()

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
