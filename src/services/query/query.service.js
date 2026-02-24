import QueryModel from '../../models/query.model.js'
import QueryActivityModel from '../../models/queryActivity.model.js'
import EmployeeModel from '../../models/employee.model.js'
import AdminModel from '../../models/admin.model.js'
import SuperAdminModel from '../../models/super.admin.js'
import CustomError from '../../utils/exception.js'
import { statusCodes, errorCodes } from '../../core/common/constant.js'

const generateQueryCode = () => {
  const num = Math.floor(10000 + Math.random() * 90000)
  return `QRY0${num}`
}

export const addQuery = async ({
  companyInfo = {},
  industry_id,
  products = [],
  delivery = {},
  status = 'pending',
  created_by,
  branchId,
}) => {
  const maxAttempts = 20
  let queryCode = ''
  const baseFilter = { isDeleted: false }
  if (branchId) baseFilter.branchId = branchId
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const candidate = generateQueryCode()
    const exists = await QueryModel.findOne({
      ...baseFilter,
      queryCode: candidate,
    }).lean()
    if (!exists) {
      queryCode = candidate
      break
    }
  }
  if (!queryCode) {
    throw new CustomError(
      statusCodes.conflict,
      'Could not generate unique query code. Please try again.',
      errorCodes.already_exist,
    )
  }

  const doc = await QueryModel.create({
    queryCode,
    status: status || 'pending',
    companyInfo: companyInfo || {},
    industry_id: industry_id || null,
    products: products || [],
    delivery: delivery || {},
    created_by: created_by || null,
    branchId: branchId || null,
  })
  return doc.toObject()
}

export const listQueries = async ({
  pageNumber = 1,
  pageSize = 10,
  search = '',
  branchFilter = {},
}) => {
  const page = Math.max(1, parseInt(pageNumber))
  const limit = Math.min(100, Math.max(1, parseInt(pageSize)))
  const skip = (page - 1) * limit

  const filter = { isDeleted: false, ...branchFilter }

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

export const getQueryById = async ({ queryId, branchFilter = {} }) => {
  const query = await QueryModel.findOne({ _id: queryId, isDeleted: false, ...branchFilter })
    .populate('industry_id', 'name location address email purchase_manager_name purchase_manager_phone')
    .populate('created_by', 'name email')
    .lean()

  if (!query) {
    throw new CustomError(
      statusCodes.notFound,
      'Query not found',
      errorCodes.not_found,
    )
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

export const listQueryActivities = async ({ queryId, pageNumber = 1, pageSize = 10, branchFilter = {} }) => {
  const queryBelongs = await QueryModel.findOne({ _id: queryId, isDeleted: false, ...branchFilter }).lean()
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
}) => {
  const query = await QueryModel.findOne({ _id: queryId, isDeleted: false, ...branchFilter }).lean()
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

export const updateQuery = async ({ queryId, companyInfo, industry_id, products, delivery, status, branchFilter = {} }) => {
  const existing = await QueryModel.findOne({ _id: queryId, isDeleted: false, ...branchFilter }).lean()
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
  if (products !== undefined) updatePayload.products = products
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

export const deleteQuery = async ({ queryId, branchFilter = {} }) => {
  const existing = await QueryModel.findOne({ _id: queryId, isDeleted: false, ...branchFilter }).lean()
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
