import QueryModel from '../../models/query.model.js'
import QueryActivityModel from '../../models/queryActivity.model.js'
import EmployeeModel from '../../models/employee.model.js'
import AdminModel from '../../models/admin.model.js'
import SuperAdminModel from '../../models/super.admin.js'
import {
  transformProductImagesToSigned,
  transformPathsToSignedUrls,
} from '../document/document.service.js'
import CustomError from '../../utils/exception.js'
import { statusCodes, errorCodes } from '../../core/common/constant.js'
import { createQuotationFromQuery, getQuotationByQueryId } from '../quotation/quotation.service.js'
import { createDraftTasksForQueryProducts } from '../taskManagement/taskManagement.service.js'
import { getNextSequence } from '../codeSequence/codeSequence.service.js'

const OBJECT_ID_REGEX = /^[a-fA-F0-9]{24}$/

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

/** Query code format: COMPANYFIRST5-QRY-MIG-IND-DD-MM-QUERYCODE (company first, rest same) */
const formatQueryCode = (numericCode, companyName) => {
  const now = new Date()
  const DD = String(now.getDate()).padStart(2, '0')
  const MM = String(now.getMonth() + 1).padStart(2, '0')
  return `${companyFirst5(companyName)}-QRY-MIG-IND-${DD}-${MM}-${numericCode}`
}
const normalizeImageIds = (images) => {
  if (!Array.isArray(images)) return []
  return images
    .map((img) => (typeof img === 'object' && img?._id ? img._id : img))
    .filter((id) => typeof id === 'string' && OBJECT_ID_REGEX.test(id))
}

const mapProductsWithImages = (products) => {
  if (!Array.isArray(products)) return []
  return products.map((p) => ({
    ...p,
    images: normalizeImageIds(p.images),
  }))
}

const getQueryOwnershipFilter = ({ currentUserId = null, isFullAccessRole = true }) => {
  if (!currentUserId || isFullAccessRole) return {}
  return { created_by: currentUserId }
}

export const addQuery = async ({
  companyInfo = {},
  industry_id,
  products = [],
  delivery = {},
  status = 'drafted',
  created_by,
  branchId,
}) => {
  const branchFilter = branchId ? { branchId } : {}
  const numericCode = await getNextSequence('queryCode')
  const queryCode = formatQueryCode(numericCode, companyInfo?.name)

  const normalizedProducts = mapProductsWithImages(products || [])

  const doc = await QueryModel.create({
    queryCode,
    status: status || 'drafted',
    companyInfo: companyInfo || {},
    industry_id: industry_id || null,
    products: normalizedProducts,
    delivery: delivery || {},
    created_by: created_by || null,
    branchId: branchId || null,
  })
  const queryObj = doc.toObject()

  // Automatically create draft tasks (one per product) in task management.
  // Errors are swallowed so query creation is not blocked.
  try {
    await createDraftTasksForQueryProducts({ query: queryObj })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to create draft tasks for query products', err)
  }

  return queryObj
}

export const listQueries = async ({
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

  const ownershipFilter = getQueryOwnershipFilter({ currentUserId, isFullAccessRole })
  const filter = { isDeleted: false, ...branchFilter, ...ownershipFilter }
  if (status && status.trim()) {
    filter.status = status.trim()
  }

  if (search && search.trim()) {
    const term = search.trim()
    filter.$or = [
      { queryCode: { $regex: term, $options: 'i' } },
      { 'companyInfo.name': { $regex: term, $options: 'i' } },
      { 'companyInfo.location': { $regex: term, $options: 'i' } },
      { 'companyInfo.email': { $regex: term, $options: 'i' } },
      { 'products.productName': { $regex: term, $options: 'i' } },
      { 'delivery.location': { $regex: term, $options: 'i' } },
      { 'delivery.contactPersonName': { $regex: term, $options: 'i' } },
    ]
  }

  const totalItems = await QueryModel.countDocuments(filter)

  const queries = await QueryModel.find(filter)
    .populate('industry_id', 'name location email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()

  const totalPages = Math.ceil(totalItems / limit)

  return {
    queries,
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

export const getQueryById = async ({
  queryId,
  branchFilter = {},
  currentUserId = null,
  isFullAccessRole = true,
}) => {
  const ownershipFilter = getQueryOwnershipFilter({ currentUserId, isFullAccessRole })
  const query = await QueryModel.findOne({ _id: queryId, isDeleted: false, ...branchFilter, ...ownershipFilter })
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

  if (!query) {
    throw new CustomError(
      statusCodes.notFound,
      'Query not found',
      errorCodes.not_found,
    )
  }

  // Transform product images (master + snapshot) to signed URLs for S3
  if (query.products?.length) {
    for (const p of query.products) {
      if (p.product_id && typeof p.product_id === 'object') {
        p.product_id = await transformProductImagesToSigned(p.product_id)
      }
      if (Array.isArray(p.images) && p.images.length) {
        p.images = await transformPathsToSignedUrls(p.images)
      }
    }
  }

  return query
}

const resolvePerformerName = async (performerId) => {
  if (!performerId) return null
  let user = await EmployeeModel.findById(performerId).select('name email').lean()
  if (user) return { name: user.name, email: user.email, role: user.role || 'employee' }
  user = await AdminModel.findById(performerId).select('name email').lean()
  if (user) return { name: user.name, email: user.email, role: 'admin' }
  user = await SuperAdminModel.findById(performerId).select('name email').lean()
  if (user) return { name: user.name, email: user.email, role: 'super_admin' }
  return null
}

export const listQueryActivities = async ({
  queryId,
  pageNumber = 1,
  pageSize = 10,
  branchFilter = {},
  currentUserId = null,
  isFullAccessRole = true,
}) => {
  const ownershipFilter = getQueryOwnershipFilter({ currentUserId, isFullAccessRole })
  const queryBelongs = await QueryModel.findOne({
    _id: queryId,
    isDeleted: false,
    ...branchFilter,
    ...ownershipFilter,
  }).lean()
  if (!queryBelongs) {
    throw new CustomError(
      statusCodes.notFound,
      'Query not found',
      errorCodes.not_found,
    )
  }

  const page = Math.max(1, parseInt(pageNumber))
  const limit = Math.min(100, Math.max(1, parseInt(pageSize)))
  const skip = (page - 1) * limit

  const filter = { queryId }
  const totalItems = await QueryActivityModel.countDocuments(filter)
  const activities = await QueryActivityModel.find(filter)
    .select('queryId type performedBy meta createdAt')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()

  const totalPages = Math.ceil(totalItems / limit)

  const performerIds = [...new Set(activities.map((a) => a.performedBy).filter(Boolean))]
  const performerMap = {}
  for (const pid of performerIds) {
    const resolved = await resolvePerformerName(pid)
    if (resolved) performerMap[String(pid)] = resolved
  }

  for (const act of activities) {
    const pid = act.performedBy
    const performer = pid ? performerMap[String(pid)] : null
    act.performedBy = performer || { name: null, email: null, role: null }
    act.performByName = performer?.name || '—'
  }

  return {
    activities,
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

export const recordQueryActivity = async ({
  queryId,
  type,
  performedBy,
  meta = {},
  branchFilter = {},
  currentUserId = null,
  isFullAccessRole = true,
}) => {
  const ownershipFilter = getQueryOwnershipFilter({ currentUserId, isFullAccessRole })
  const query = await QueryModel.findOne({ _id: queryId, isDeleted: false, ...branchFilter, ...ownershipFilter }).lean()
  if (!query) {
    throw new CustomError(
      statusCodes.notFound,
      'Query not found',
      errorCodes.not_found,
    )
  }

  const activity = await QueryActivityModel.create({
    queryId,
    type,
    performedBy,
    meta: {
      action: meta.action || '',
      followUpStatus: meta.followUpStatus || '',
      note: meta.note || '',
    },
  })

  const populated = await QueryActivityModel.findById(activity._id)
    .populate('performedBy', 'name email')
    .lean()
  return populated
}

export const updateQuery = async ({
  queryId,
  companyInfo,
  industry_id,
  products,
  delivery,
  status,
  branchFilter = {},
  currentUserId = null,
  isFullAccessRole = true,
}) => {
  const ownershipFilter = getQueryOwnershipFilter({ currentUserId, isFullAccessRole })
  const existing = await QueryModel.findOne({ _id: queryId, isDeleted: false, ...branchFilter, ...ownershipFilter }).lean()
  if (!existing) {
    throw new CustomError(
      statusCodes.notFound,
      'Query not found',
      errorCodes.not_found,
    )
  }

  const updatePayload = {}
  if (companyInfo !== undefined) updatePayload.companyInfo = companyInfo
  if (industry_id !== undefined) updatePayload.industry_id = industry_id || null
  if (products !== undefined) updatePayload.products = mapProductsWithImages(products)
  if (delivery !== undefined) updatePayload.delivery = delivery
  if (status !== undefined) updatePayload.status = status

  const updated = await QueryModel.findByIdAndUpdate(
    queryId,
    updatePayload,
    { new: true, runValidators: true },
  )
    .populate('industry_id', 'name location email')
    .lean()

  return updated
}

export const deleteQuery = async ({
  queryId,
  branchFilter = {},
  currentUserId = null,
  isFullAccessRole = true,
}) => {
  const ownershipFilter = getQueryOwnershipFilter({ currentUserId, isFullAccessRole })
  const existing = await QueryModel.findOne({ _id: queryId, isDeleted: false, ...branchFilter, ...ownershipFilter }).lean()
  if (!existing) {
    throw new CustomError(
      statusCodes.notFound,
      'Query not found',
      errorCodes.not_found,
    )
  }

  await QueryModel.findByIdAndUpdate(queryId, { isDeleted: true }, { new: true })

  return {
    deletedQuery: {
      id: existing._id,
      companyName: existing.companyInfo?.name,
      deletedAt: new Date().toISOString(),
    },
  }
}

export const convertQueryToQuotation = async ({
  queryCode,
  created_by,
  branchFilter = {},
  remark,
  products,
  isFullAccessRole = true,
}) => {
  const ownershipFilter = getQueryOwnershipFilter({
    currentUserId: created_by,
    isFullAccessRole,
  })
  const existing = await QueryModel.findOne({
    queryCode,
    isDeleted: false,
    ...branchFilter,
    ...ownershipFilter,
  }).lean()
  if (!existing) {
    throw new CustomError(
      statusCodes.notFound,
      'Query not found',
      errorCodes.not_found,
    )
  }

  let quotation = await getQuotationByQueryId({ queryId: existing._id, branchFilter })
  if (!quotation) {
    quotation = await createQuotationFromQuery({
      queryId: existing._id,
      created_by,
      branchId: existing.branchId,
      branchFilter,
      remark,
      productsOverride: products,
    })
  }

  if (existing.status !== 'convertedToQuotation') {
    await QueryModel.updateOne(
      { _id: existing._id },
      { $set: { status: 'convertedToQuotation' } },
    )
  }

  const updatedQuery = await QueryModel.findById(existing._id)
    .populate('industry_id', 'name location address email purchase_manager_name purchase_manager_phone')
    .lean()

  return { query: updatedQuery, quotation }
}
