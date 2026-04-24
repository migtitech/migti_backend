import mongoose from 'mongoose'
import VisitModel from '../../models/visit.model.js'
import EmployeeModel from '../../models/employee.model.js'
import AreaModel from '../../models/area.model.js'
import CustomError from '../../utils/exception.js'
import { statusCodes, errorCodes } from '../../core/common/constant.js'

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

const getRangeFromPeriod = (period = 'all') => {
  const now = new Date()
  const end = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      23,
      59,
      59,
      999
    )
  )
  let start = null
  if (period === 'daily') {
    start = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        0,
        0,
        0,
        0
      )
    )
  } else if (period === 'weekly') {
    start = new Date(end)
    start.setUTCDate(start.getUTCDate() - 6)
    start.setUTCHours(0, 0, 0, 0)
  } else if (period === 'monthly') {
    start = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0)
    )
  }
  return { start, end }
}

const buildDateFilter = ({ period = 'all', dateFrom = '', dateTo = '' }) => {
  let fromD =
    dateFrom && String(dateFrom).trim() ? startOfUtcDay(dateFrom) : null
  let toD = dateTo && String(dateTo).trim() ? endOfUtcDay(dateTo) : null
  if (!fromD && !toD && period && period !== 'all') {
    const range = getRangeFromPeriod(period)
    fromD = range.start
    toD = range.end
  }

  if (fromD && toD && fromD > toD) {
    throw new CustomError(
      statusCodes.badRequest,
      'dateFrom must be on or before dateTo',
      errorCodes.bad_request
    )
  }

  if (!fromD && !toD) return {}

  const createdAt = {}
  if (fromD) createdAt.$gte = fromD
  if (toD) createdAt.$lte = toD
  return { createdAt }
}

export const createVisit = async ({
  branchId,
  zoneId,
  employeeId,
  industryIds = [],
  instructions = '',
  status = 'active',
  created_by = null,
}) => {
  const [zone, employee] = await Promise.all([
    AreaModel.findOne({
      _id: zoneId,
      branchId,
      isDeleted: false,
      areaType: 'industry',
    }).lean(),
    EmployeeModel.findOne({
      _id: employeeId,
      branchId,
      isDeleted: false,
    }).lean(),
  ])

  if (!zone) {
    throw new CustomError(
      statusCodes.badRequest,
      'Zone not found for selected branch',
      errorCodes.not_found
    )
  }

  if (!employee) {
    throw new CustomError(
      statusCodes.badRequest,
      'Employee not found for selected branch',
      errorCodes.not_found
    )
  }

  const uniqueIndustryIds = Array.from(
    new Set((industryIds || []).map((id) => String(id)))
  )
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id))

  const doc = await VisitModel.create({
    branchId,
    zoneId,
    employeeId,
    industryIds: uniqueIndustryIds,
    instructions: String(instructions || '').trim(),
    status:
      String(status || 'active').toLowerCase() === 'completed'
        ? 'completed'
        : 'active',
    created_by: created_by || null,
  })

  return doc.toObject()
}

export const listVisits = async ({
  pageNumber = 1,
  pageSize = 10,
  period = 'all',
  dateFrom = '',
  dateTo = '',
  status = '',
  branchFilter = {},
  extraFilter = {},
}) => {
  const page = Math.max(1, parseInt(pageNumber, 10))
  const limit = Math.min(100, Math.max(1, parseInt(pageSize, 10)))
  const skip = (page - 1) * limit

  const dateFilter = buildDateFilter({ period, dateFrom, dateTo })
  const statusFilter = status ? { status } : {}
  const filter = {
    isDeleted: false,
    ...branchFilter,
    ...extraFilter,
    ...statusFilter,
    ...dateFilter,
  }
  const totalItems = await VisitModel.countDocuments(filter)

  const visits = await VisitModel.find(filter)
    .populate('branchId', 'name location')
    .populate('zoneId', 'name city areaType')
    .populate('employeeId', 'name role')
    .populate('industryIds', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()

  const totalPages = Math.max(1, Math.ceil(totalItems / limit))

  return {
    visits: visits.map((visit) => ({
      _id: visit._id,
      branchId: visit.branchId?._id || visit.branchId || null,
      branchName: visit.branchId?.name || '-',
      zoneId: visit.zoneId?._id || visit.zoneId || null,
      zoneName: visit.zoneId?.name || '-',
      employeeId: visit.employeeId?._id || visit.employeeId || null,
      employeeName: visit.employeeId?.name || '-',
      industries: Array.isArray(visit.industryIds)
        ? visit.industryIds.map((industry) => ({
            id: industry?._id || industry,
            name: industry?.name || '-',
          }))
        : [],
      instructions: visit.instructions || '',
      status: visit.status || 'active',
      remark: visit.remark || '',
      createdAt: visit.createdAt,
    })),
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

export const completeVisitWithRemark = async ({
  visitId,
  employeeId,
  branchFilter = {},
  remark = '',
}) => {
  const trimmedRemark = String(remark || '').trim()
  const words = trimmedRemark.split(/\s+/).filter(Boolean)
  if (words.length < 20) {
    throw new CustomError(
      statusCodes.badRequest,
      'Remark must contain at least 20 words',
      errorCodes.bad_request
    )
  }

  const visit = await VisitModel.findOne({
    _id: visitId,
    employeeId,
    isDeleted: false,
    ...branchFilter,
  }).lean()

  if (!visit) {
    throw new CustomError(
      statusCodes.notFound,
      'Visit not found',
      errorCodes.not_found
    )
  }

  const updated = await VisitModel.findByIdAndUpdate(
    visitId,
    {
      remark: trimmedRemark,
      status: 'completed',
    },
    { new: true, runValidators: true }
  ).lean()

  return updated
}
