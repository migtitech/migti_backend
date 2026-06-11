import CustomError from '../../utils/exception.js'
import { statusCodes, errorCodes } from '../../core/common/constant.js'
import { findIndustryIdsByNameSearch } from '../../repository/industry.repository.js'
import {
  countRawQueries,
  createRawQuery,
  deleteRawQueryById,
  findRawQueries,
  findRawQueryById,
  findRawQueryByIdLean,
  rawQueryNumberExists,
  updateRawQueryById,
} from '../../repository/rawQuery.repository.js'
import {
  countRawQueryActivities,
  createRawQueryActivity,
  findRawQueryActivities,
  findRawQueryActivityById,
} from '../../repository/rawQueryActivity.repository.js'
import { findEmployeeByIdWithNameEmail } from '../../repository/employee.repository.js'
import { findAdminByIdWithNameEmail } from '../../repository/admin.repository.js'
import { findSuperAdminByIdWithNameEmail } from '../../repository/superAdmin.repository.js'

const generateRawQueryNumber = async () => {
  let number
  let exists = true
  while (exists) {
    const rand = Math.floor(10000 + Math.random() * 90000)
    number = `RQRY0${rand}`
    exists = await rawQueryNumberExists(number)
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

  const rawQueryDoc = await createRawQuery({
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
    const industryIds = await findIndustryIdsByNameSearch(search)
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { company_info: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { priority: { $regex: search, $options: 'i' } },
      { raw_query_number: { $regex: search, $options: 'i' } },
      ...(industryIds.length ? [{ industry_id: { $in: industryIds } }] : []),
    ]
  }

  const totalItems = await countRawQueries(filter)

  const rawQueries = await findRawQueries(filter, skip, limit)

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
  const rawQuery = await findRawQueryById({
    _id: rawQueryId,
    ...branchFilter,
  })

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
  let user = await findEmployeeByIdWithNameEmail(performerId)
  if (user)
    return { name: user.name, email: user.email, role: user.role || 'employee' }
  user = await findAdminByIdWithNameEmail(performerId)
  if (user) return { name: user.name, email: user.email, role: 'admin' }
  user = await findSuperAdminByIdWithNameEmail(performerId)
  if (user) return { name: user.name, email: user.email, role: 'super_admin' }
  return null
}

export const listRawQueryActivities = async ({
  rawQueryId,
  pageNumber = 1,
  pageSize = 10,
  branchFilter = {},
}) => {
  const rawQueryBelongs = await findRawQueryByIdLean({
    _id: rawQueryId,
    ...branchFilter,
  })
  if (!rawQueryBelongs) {
    throw new CustomError(
      statusCodes.notFound,
      'Raw query not found',
      errorCodes.not_found
    )
  }

  const page = Math.max(1, parseInt(pageNumber))
  const limit = Math.min(100, Math.max(1, parseInt(pageSize)))
  const skip = (page - 1) * limit

  const filter = { rawQueryId }
  const totalItems = await countRawQueryActivities(filter)
  const activities = await findRawQueryActivities(filter, skip, limit)

  const totalPages = Math.ceil(totalItems / limit)

  const performerIds = [
    ...new Set(activities.map((a) => a.performedBy).filter(Boolean)),
  ]
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
  const rawQuery = await findRawQueryByIdLean({
    _id: rawQueryId,
    ...branchFilter,
  })
  if (!rawQuery) {
    throw new CustomError(
      statusCodes.notFound,
      'Raw query not found',
      errorCodes.not_found
    )
  }

  const activity = await createRawQueryActivity({
    rawQueryId,
    type,
    performedBy,
    meta: {
      action: meta.action || '',
      followUpStatus: meta.followUpStatus || '',
      note: meta.note || '',
    },
  })

  const populated = await findRawQueryActivityById(activity._id)
  return populated
}

export const updateRawQuery = async ({
  rawQueryId,
  branchFilter = {},
  ...updateData
}) => {
  const rawQuery = await findRawQueryByIdLean({
    _id: rawQueryId,
    ...branchFilter,
  })
  if (!rawQuery) {
    throw new CustomError(
      statusCodes.notFound,
      'Raw query not found',
      errorCodes.not_found
    )
  }

  const updatedRawQuery = await updateRawQueryById(rawQueryId, updateData, {
    new: true,
    runValidators: true,
  })

  return updatedRawQuery
}

export const deleteRawQuery = async ({ rawQueryId, branchFilter = {} }) => {
  const rawQuery = await findRawQueryByIdLean({
    _id: rawQueryId,
    ...branchFilter,
  })
  if (!rawQuery) {
    throw new CustomError(
      statusCodes.notFound,
      'Raw query not found',
      errorCodes.not_found
    )
  }

  await deleteRawQueryById(rawQueryId)

  return {
    deletedRawQuery: {
      id: rawQuery._id,
      title: rawQuery.title,
      company_info: rawQuery.company_info,
      deletedAt: new Date().toISOString(),
    },
  }
}
