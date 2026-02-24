import RawQueryModel from '../../models/rawQuery.model.js'
import SuperAdminModel from '../../models/super.admin.js'
import RawQueryActivityModel from '../../models/rawQueryActivity.model.js'
import EmployeeModel from '../../models/employee.model.js'
import AdminModel from '../../models/admin.model.js'
import IndustryModel from '../../models/industry.model.js'
import CustomError from '../../utils/exception.js'
import { statusCodes, errorCodes } from '../../core/common/constant.js'

const generateRawQueryNumber = async () => {
  let number
  let exists = true
  while (exists) {
    const rand = Math.floor(10000 + Math.random() * 90000)
    number = `RQRY0${rand}`
    exists = await RawQueryModel.exists({ raw_query_number: number })
  }
  return number
}

export const addRawQuery = async ({
  priority,
  title,
  company_info = '',
  industry_id,
  supplier_id,
  description,
  files = [],
  created_by,
  branchId,
}) => {
  const raw_query_number = await generateRawQueryNumber()

  const rawQueryDoc = await RawQueryModel.create({
    raw_query_number,
    priority,
    title,
    company_info: company_info || '',
    industry_id: industry_id || null,
    supplier_id: supplier_id || null,
    description,
    files,
    created_by,
    branchId: branchId || null,
  })

  return rawQueryDoc.toObject()
}

export const listRawQueries = async ({
  pageNumber = 1,
  pageSize = 10,
  search = '',
  branchFilter = {},
}) => {
  const page = Math.max(1, parseInt(pageNumber))
  const limit = Math.min(100, Math.max(1, parseInt(pageSize)))
  const skip = (page - 1) * limit

  const filter = { ...branchFilter }
  if (search) {
    const industryIds = await IndustryModel.find({
      name: { $regex: search, $options: 'i' },
      isDeleted: false,
    })
      .distinct('_id')
      .lean()
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { company_info: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { priority: { $regex: search, $options: 'i' } },
      { raw_query_number: { $regex: search, $options: 'i' } },
      ...(industryIds.length ? [{ industry_id: { $in: industryIds } }] : []),
    ]
  }

  const totalItems = await RawQueryModel.countDocuments(filter)

  const rawQueries = await RawQueryModel.find(filter)
    .populate('industry_id', 'name location email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()

  const totalPages = Math.ceil(totalItems / limit)
  const hasNextPage = page < totalPages
  const hasPrevPage = page > 1

  return {
    rawQueries,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems,
      itemsPerPage: limit,
      hasNextPage,
      hasPrevPage,
    },
  }
}

export const getRawQueryById = async ({ rawQueryId, branchFilter = {} }) => {
  const rawQuery = await RawQueryModel.findOne({ _id: rawQueryId, ...branchFilter })
    .populate('supplier_id')
    .populate('industry_id', 'name location address email purchase_manager_name purchase_manager_phone')
    .populate('created_by', 'name email')
    .lean()

  if (!rawQuery) {
    throw new CustomError(
      statusCodes.notFound,
      'Raw query not found',
      errorCodes.not_found
    )
  }

  return rawQuery
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

export const listRawQueryActivities = async ({ rawQueryId, pageNumber = 1, pageSize = 10, branchFilter = {} }) => {
  const rawQueryBelongs = await RawQueryModel.findOne({ _id: rawQueryId, ...branchFilter }).lean()
  if (!rawQueryBelongs) {
    throw new CustomError(
      statusCodes.notFound,
      'Raw query not found',
      errorCodes.not_found,
    )
  }

  const page = Math.max(1, parseInt(pageNumber))
  const limit = Math.min(100, Math.max(1, parseInt(pageSize)))
  const skip = (page - 1) * limit

  const filter = { rawQueryId }
  const totalItems = await RawQueryActivityModel.countDocuments(filter)
  const activities = await RawQueryActivityModel.find(filter)
    .select('rawQueryId type performedBy meta createdAt')
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

export const recordRawQueryActivity = async ({
  rawQueryId,
  type,
  performedBy,
  meta = {},
  branchFilter = {},
}) => {
  const rawQuery = await RawQueryModel.findOne({ _id: rawQueryId, ...branchFilter }).lean()
  if (!rawQuery) {
    throw new CustomError(
      statusCodes.notFound,
      'Raw query not found',
      errorCodes.not_found
    )
  }

  const activity = await RawQueryActivityModel.create({
    rawQueryId,
    type,
    performedBy,
    meta: {
      action: meta.action || '',
      followUpStatus: meta.followUpStatus || '',
      note: meta.note || '',
    },
  })

  const populated = await RawQueryActivityModel.findById(activity._id)
    .populate('performedBy', 'name email')
    .lean()
  return populated
}

export const updateRawQuery = async ({ rawQueryId, branchFilter = {}, ...updateData }) => {
  const rawQuery = await RawQueryModel.findOne({ _id: rawQueryId, ...branchFilter }).lean()
  if (!rawQuery) {
    throw new CustomError(
      statusCodes.notFound,
      'Raw query not found',
      errorCodes.not_found
    )
  }

  const updatedRawQuery = await RawQueryModel.findByIdAndUpdate(
    rawQueryId,
    updateData,
    {
      new: true,
      runValidators: true,
    }
  ).lean()

  return updatedRawQuery
}

export const deleteRawQuery = async ({ rawQueryId, branchFilter = {} }) => {
  const rawQuery = await RawQueryModel.findOne({ _id: rawQueryId, ...branchFilter }).lean()
  if (!rawQuery) {
    throw new CustomError(
      statusCodes.notFound,
      'Raw query not found',
      errorCodes.not_found
    )
  }

  await RawQueryModel.findByIdAndDelete(rawQueryId)

  return {
    deletedRawQuery: {
      id: rawQuery._id,
      title: rawQuery.title,
      company_info: rawQuery.company_info,
      deletedAt: new Date().toISOString(),
    },
  }
}
