import mongoose from 'mongoose'
import { countQueries } from '../../repository/query.repository.js'
import quotationRepository, {
  findQuotationsProductsForSum,
} from '../../repository/quotation.repository.js'
import poEntryRepository from '../../repository/poEntry.repository.js'
import billingEntryRepository from '../../repository/billingEntry.repository.js'
import {
  findEmployeesSelectIdByBranch,
  findZoneEmployeesSelectId,
} from '../../repository/employee.repository.js'
import {
  findTargetAnalytics,
  findOneTargetAnalytics,
  findOneTargetAnalyticsForSummary,
  createTargetAnalytics,
  findExpiredTargetAnalytics,
  softDeleteTargetAnalyticsById,
} from '../../repository/targetAnalytics.repository.js'
import {
  findTargetAnalyticsHistory,
  findOneTargetAnalyticsHistory,
  createTargetAnalyticsHistory,
} from '../../repository/targetAnalyticsHistory.repository.js'
import {
  findBranchZoneTargets,
  findOneBranchZoneTarget,
  findOneBranchZoneTargetForSummary,
  createBranchZoneTarget,
  closeExpiredBranchZoneTargets,
  findMyBranchZoneTargets,
  findExpiredBranchZoneTargets,
  softDeleteBranchZoneTargetById,
} from '../../repository/branchZoneTarget.repository.js'
import {
  findBranchZoneTargetHistory,
  findOneBranchZoneTargetHistory,
  createBranchZoneTargetHistory,
} from '../../repository/branchZoneTargetHistory.repository.js'
import {
  findBranchEmployeeTargets,
  findOneBranchEmployeeTarget,
  findOneBranchEmployeeTargetForSummary,
  createBranchEmployeeTarget,
  findExpiredBranchEmployeeTargets,
  softDeleteBranchEmployeeTargetById,
} from '../../repository/branchEmployeeTarget.repository.js'
import {
  findBranchEmployeeTargetHistory,
  findOneBranchEmployeeTargetHistory,
  createBranchEmployeeTargetHistory,
} from '../../repository/branchEmployeeTargetHistory.repository.js'
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

const computeQuotationAmount = (products = []) => {
  if (!Array.isArray(products) || !products.length) return 0
  return products.reduce((sum, item) => {
    if (item?.notAvailable) return sum
    const qty = Number(item?.quantity)
    const rate = Number(item?.rate)
    if (Number.isNaN(qty) || Number.isNaN(rate) || qty < 0 || rate < 0)
      return sum
    let lineTotal = qty * rate
    if (item?.applyDiscount && item?.discountPercentage != null) {
      const discount = lineTotal * (Number(item.discountPercentage) / 100)
      lineTotal = Math.max(0, lineTotal - discount)
    }
    return sum + lineTotal
  }, 0)
}

const getMetricsForRange = async ({ branchId, dateFrom, dateTo }) => {
  const queryFilter = {
    isDeleted: false,
    branchId,
    createdAt: { $gte: dateFrom, $lte: dateTo },
  }
  const quotationFilter = {
    isDeleted: false,
    branchId,
    createdAt: { $gte: dateFrom, $lte: dateTo },
  }
  const poFilter = {
    isDeleted: false,
    branchId,
    entryDate: { $gte: dateFrom, $lte: dateTo },
  }
  const billingFilter = {
    isDeleted: false,
    branchId,
    entryDate: { $gte: dateFrom, $lte: dateTo },
  }

  const [
    totalQueries,
    totalQuotation,
    totalPo,
    totalBilling,
    poAmountAgg,
    billingAmountAgg,
  ] = await Promise.all([
    countQueries(queryFilter),
    quotationRepository.countDocuments(quotationFilter),
    poEntryRepository.countDocuments(poFilter),
    billingEntryRepository.countDocuments(billingFilter),
    poEntryRepository.aggregate([
      { $match: poFilter },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    billingEntryRepository.aggregate([
      { $match: billingFilter },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ])

  const quotations = await findQuotationsProductsForSum(quotationFilter)
  const quotedAmount = quotations.reduce(
    (sum, q) => sum + computeQuotationAmount(q?.products || []),
    0
  )

  return {
    totalQueries,
    totalQuotation,
    totalPo,
    totalBilling,
    quotedAmount,
    poAmount: poAmountAgg?.[0]?.total || 0,
    billingAmount: billingAmountAgg?.[0]?.total || 0,
  }
}

export const getTargetAnalytics = async ({
  branchId,
  period,
  dateFrom,
  dateTo,
  branchFilter = {},
}) => {
  const filter = { isDeleted: false, ...branchFilter }
  if (branchId && !filter.branchId) filter.branchId = branchId
  if (period) filter.period = period
  if (dateFrom) filter.dateFrom = { $gte: startOfUtcDay(dateFrom) }
  if (dateTo)
    filter.dateTo = { ...(filter.dateTo || {}), $lte: endOfUtcDay(dateTo) }

  const [activeTargets, history] = await Promise.all([
    findTargetAnalytics(filter),
    findTargetAnalyticsHistory(filter),
  ])

  return { activeTargets, history }
}

export const upsertTargetAnalytics = async ({
  branchId,
  period,
  dateFrom,
  dateTo,
  targetAmount,
  userId,
  branchFilter: _branchFilter = {},
}) => {
  const from = startOfUtcDay(dateFrom)
  const to = endOfUtcDay(dateTo)
  if (!from || !to || from > to) {
    throw new CustomError(
      statusCodes.badRequest,
      'dateFrom must be on or before dateTo',
      errorCodes.bad_request
    )
  }

  const existing = await findOneTargetAnalytics({
    isDeleted: false,
    branchId,
    period,
    dateFrom: from,
    dateTo: to,
  })

  if (existing) {
    existing.targetAmount = Number(targetAmount) || 0
    existing.updated_by = userId || null
    await existing.save()
    return existing.toObject()
  }

  const created = await createTargetAnalytics({
    branchId,
    period,
    dateFrom: from,
    dateTo: to,
    targetAmount: Number(targetAmount) || 0,
    created_by: userId || null,
    updated_by: userId || null,
  })
  return created.toObject()
}

export const archiveExpiredTargets = async () => {
  const now = new Date()
  const expiredTargets = await findExpiredTargetAnalytics(now)

  if (!expiredTargets.length) return { processed: 0 }

  for (const target of expiredTargets) {
    const snapshot = await getMetricsForRange({
      branchId: target.branchId,
      dateFrom: target.dateFrom,
      dateTo: target.dateTo,
    })

    const alreadyArchived = await findOneTargetAnalyticsHistory({
      sourceTargetId: target._id,
      isDeleted: false,
    })
    if (!alreadyArchived) {
      await createTargetAnalyticsHistory({
        sourceTargetId: target._id,
        branchId: target.branchId,
        period: target.period,
        dateFrom: target.dateFrom,
        dateTo: target.dateTo,
        targetAmount: target.targetAmount || 0,
        actualBillingAmount: snapshot.billingAmount || 0,
        actualPoAmount: snapshot.poAmount || 0,
        analyticsSnapshot: snapshot,
        archivedAt: new Date(),
      })
    }

    await softDeleteTargetAnalyticsById(target._id)
  }

  return { processed: expiredTargets.length }
}

const getCurrentPeriodRange = (period = 'weekly') => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  let start = new Date(today)
  let end = new Date(today)

  if (period === 'weekly') {
    start.setDate(today.getDate() - 6)
  } else {
    start = new Date(today.getFullYear(), today.getMonth(), 1)
    const lastDay = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0
    ).getDate()
    end = new Date(
      today.getFullYear(),
      today.getMonth(),
      Math.min(30, lastDay),
      23,
      59,
      59,
      999
    )
  }

  start.setHours(0, 0, 0, 0)
  if (period === 'weekly') end.setHours(23, 59, 59, 999)

  return { start, end }
}

export const getTargetSummary = async ({
  branchId,
  period = 'weekly',
  branchFilter: _branchFilter = {},
}) => {
  if (!branchId) {
    throw new CustomError(
      statusCodes.badRequest,
      'branchId is required',
      errorCodes.bad_request
    )
  }

  const branchObjectId = mongoose.Types.ObjectId.isValid(branchId)
    ? new mongoose.Types.ObjectId(branchId)
    : branchId

  const { start, end } = getCurrentPeriodRange(period)
  const targetDoc = await findOneTargetAnalyticsForSummary({
    isDeleted: false,
    branchId,
    period,
    dateFrom: { $lte: end },
    dateTo: { $gte: start },
  })

  const rangeFrom = targetDoc?.dateFrom || start
  const rangeTo = targetDoc?.dateTo || end

  const branchEmployeeRows = await findEmployeesSelectIdByBranch({
    isDeleted: false,
    branchId: branchObjectId,
  })
  const branchEmployeeIds = branchEmployeeRows.map((row) => row._id)

  const billingMatch = {
    isDeleted: false,
    createdAt: { $gte: rangeFrom, $lte: rangeTo },
    $or: [{ branchId: branchObjectId }],
  }
  if (branchEmployeeIds.length) {
    billingMatch.$or.push({
      branchId: null,
      created_by: { $in: branchEmployeeIds },
    })
  }

  const billingAgg = await billingEntryRepository.aggregate([
    {
      $match: billingMatch,
    },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ])

  const targetAmount = Number(targetDoc?.targetAmount || 0)
  const achievedAmount = Number(billingAgg?.[0]?.total || 0)
  const remainingAmount = Math.max(0, targetAmount - achievedAmount)

  return {
    period,
    dateFrom: rangeFrom,
    dateTo: rangeTo,
    targetAmount,
    achievedAmount,
    remainingAmount,
    targetId: targetDoc?._id || null,
  }
}

export const getZoneTargetAnalytics = async ({
  branchId = '',
  zoneId = '',
  period = '',
  branchFilter = {},
}) => {
  const filter = { isDeleted: false, ...branchFilter }
  if (branchId && !filter.branchId) filter.branchId = branchId
  if (zoneId) filter.zoneId = zoneId
  if (period) filter.period = period
  const [activeTargets, history] = await Promise.all([
    findBranchZoneTargets(filter),
    findBranchZoneTargetHistory(filter),
  ])
  return { activeTargets, history }
}

export const upsertZoneTargetAnalytics = async ({
  branchId,
  zoneId,
  period,
  dateFrom,
  dateTo,
  targetAmount,
  remark,
  status,
  userId,
  branchFilter: _branchFilter = {},
}) => {
  const from = startOfUtcDay(dateFrom)
  const to = endOfUtcDay(dateTo)
  if (!from || !to || from > to) {
    throw new CustomError(
      statusCodes.badRequest,
      'dateFrom must be on or before dateTo',
      errorCodes.bad_request
    )
  }
  const existing = await findOneBranchZoneTarget({
    isDeleted: false,
    branchId,
    zoneId,
    period,
    dateFrom: from,
    dateTo: to,
  })
  if (existing) {
    existing.targetAmount = Number(targetAmount) || 0
    if (remark !== undefined) existing.remark = remark || ''
    if (status !== undefined) existing.status = status
    existing.updated_by = userId || null
    await existing.save()
    return existing.toObject()
  }
  const created = await createBranchZoneTarget({
    branchId,
    zoneId,
    period,
    dateFrom: from,
    dateTo: to,
    targetAmount: Number(targetAmount) || 0,
    remark: remark || '',
    status: status || 'active',
    created_by: userId || null,
    updated_by: userId || null,
  })
  return created.toObject()
}

export const closeExpiredZoneTargets = async () => {
  const now = new Date()
  const result = await closeExpiredBranchZoneTargets(now)
  return { closed: result.modifiedCount }
}

export const getMyZoneTargets = async ({ zoneIds = [], branchId }) => {
  const filter = { isDeleted: false }
  if (zoneIds.length) {
    filter.zoneId = {
      $in: zoneIds.map((id) => new mongoose.Types.ObjectId(String(id))),
    }
  }
  if (branchId) filter.branchId = new mongoose.Types.ObjectId(String(branchId))
  const targets = await findMyBranchZoneTargets(filter)
  return targets
}

export const getZoneTargetSummary = async ({
  branchId,
  zoneId,
  period = 'weekly',
  branchFilter: _branchFilter = {},
}) => {
  if (!branchId || !zoneId)
    throw new CustomError(
      statusCodes.badRequest,
      'branchId and zoneId are required',
      errorCodes.bad_request
    )
  const branchObjectId = new mongoose.Types.ObjectId(branchId)
  const zoneObjectId = new mongoose.Types.ObjectId(zoneId)
  const { start, end } = getCurrentPeriodRange(period)
  const targetDoc = await findOneBranchZoneTargetForSummary({
    isDeleted: false,
    branchId: branchObjectId,
    zoneId: zoneObjectId,
    period,
    dateFrom: { $lte: end },
    dateTo: { $gte: start },
  })
  const rangeFrom = targetDoc?.dateFrom || start
  const rangeTo = targetDoc?.dateTo || end
  const zoneEmployees = await findZoneEmployeesSelectId({
    isDeleted: false,
    branchId: branchObjectId,
    $or: [
      { zoneIds: zoneObjectId },
      { zoneId: zoneObjectId }, // legacy fallback
    ],
  })
  const employeeIds = zoneEmployees.map((e) => e._id)
  const match = {
    isDeleted: false,
    createdAt: { $gte: rangeFrom, $lte: rangeTo },
    ...(employeeIds.length
      ? {
          $or: [
            { salespersonId: { $in: employeeIds } },
            { created_by: { $in: employeeIds } },
          ],
        }
      : { salespersonId: null }),
  }
  const agg = await billingEntryRepository.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ])
  const targetAmount = Number(targetDoc?.targetAmount || 0)
  const achievedAmount = Number(agg?.[0]?.total || 0)
  return {
    period,
    dateFrom: rangeFrom,
    dateTo: rangeTo,
    targetAmount,
    achievedAmount,
    remainingAmount: Math.max(0, targetAmount - achievedAmount),
    targetId: targetDoc?._id || null,
  }
}

export const getEmployeeTargetAnalytics = async ({
  branchId = '',
  employeeId = '',
  period = '',
  branchFilter = {},
}) => {
  const filter = { isDeleted: false, ...branchFilter }
  if (branchId && !filter.branchId) filter.branchId = branchId
  if (employeeId) filter.employeeId = employeeId
  if (period) filter.period = period
  const [activeTargets, history] = await Promise.all([
    findBranchEmployeeTargets(filter),
    findBranchEmployeeTargetHistory(filter),
  ])
  return { activeTargets, history }
}

export const upsertEmployeeTargetAnalytics = async ({
  branchId,
  zoneId = null,
  employeeId,
  period,
  dateFrom,
  dateTo,
  targetAmount,
  userId,
  branchFilter: _branchFilter = {},
}) => {
  const from = startOfUtcDay(dateFrom)
  const to = endOfUtcDay(dateTo)
  if (!from || !to || from > to) {
    throw new CustomError(
      statusCodes.badRequest,
      'dateFrom must be on or before dateTo',
      errorCodes.bad_request
    )
  }
  const existing = await findOneBranchEmployeeTarget({
    isDeleted: false,
    branchId,
    employeeId,
    period,
    dateFrom: from,
    dateTo: to,
  })
  if (existing) {
    existing.targetAmount = Number(targetAmount) || 0
    existing.zoneId = zoneId || existing.zoneId || null
    existing.updated_by = userId || null
    await existing.save()
    return existing.toObject()
  }
  const created = await createBranchEmployeeTarget({
    branchId,
    zoneId: zoneId || null,
    employeeId,
    period,
    dateFrom: from,
    dateTo: to,
    targetAmount: Number(targetAmount) || 0,
    created_by: userId || null,
    updated_by: userId || null,
  })
  return created.toObject()
}

export const getEmployeeTargetSummary = async ({
  branchId,
  employeeId,
  period = 'weekly',
  branchFilter: _branchFilter = {},
}) => {
  if (!branchId || !employeeId)
    throw new CustomError(
      statusCodes.badRequest,
      'branchId and employeeId are required',
      errorCodes.bad_request
    )
  const branchObjectId = new mongoose.Types.ObjectId(branchId)
  const employeeObjectId = new mongoose.Types.ObjectId(employeeId)
  const { start, end } = getCurrentPeriodRange(period)
  const targetDoc = await findOneBranchEmployeeTargetForSummary({
    isDeleted: false,
    branchId: branchObjectId,
    employeeId: employeeObjectId,
    period,
    dateFrom: { $lte: end },
    dateTo: { $gte: start },
  })
  const rangeFrom = targetDoc?.dateFrom || start
  const rangeTo = targetDoc?.dateTo || end
  const agg = await billingEntryRepository.aggregate([
    {
      $match: {
        isDeleted: false,
        createdAt: { $gte: rangeFrom, $lte: rangeTo },
        $or: [
          { salespersonId: employeeObjectId },
          { created_by: employeeObjectId },
        ],
      },
    },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ])
  const targetAmount = Number(targetDoc?.targetAmount || 0)
  const achievedAmount = Number(agg?.[0]?.total || 0)
  return {
    period,
    dateFrom: rangeFrom,
    dateTo: rangeTo,
    targetAmount,
    achievedAmount,
    remainingAmount: Math.max(0, targetAmount - achievedAmount),
    targetId: targetDoc?._id || null,
  }
}

export const archiveExpiredZoneAndEmployeeTargets = async () => {
  const now = new Date()
  const expiredZone = await findExpiredBranchZoneTargets(now)
  for (const target of expiredZone) {
    const snapshot = await getZoneTargetSummary({
      branchId: String(target.branchId),
      zoneId: String(target.zoneId),
      period: target.period,
      branchFilter: {},
    })
    const exists = await findOneBranchZoneTargetHistory({
      sourceTargetId: target._id,
      isDeleted: false,
    })
    if (!exists) {
      await createBranchZoneTargetHistory({
        sourceTargetId: target._id,
        branchId: target.branchId,
        zoneId: target.zoneId,
        period: target.period,
        dateFrom: target.dateFrom,
        dateTo: target.dateTo,
        targetAmount: target.targetAmount || 0,
        actualBillingAmount: snapshot.achievedAmount || 0,
        archivedAt: new Date(),
      })
    }
    await softDeleteBranchZoneTargetById(target._id)
  }
  const expiredEmployee = await findExpiredBranchEmployeeTargets(now)
  for (const target of expiredEmployee) {
    const snapshot = await getEmployeeTargetSummary({
      branchId: String(target.branchId),
      employeeId: String(target.employeeId),
      period: target.period,
      branchFilter: {},
    })
    const exists = await findOneBranchEmployeeTargetHistory({
      sourceTargetId: target._id,
      isDeleted: false,
    })
    if (!exists) {
      await createBranchEmployeeTargetHistory({
        sourceTargetId: target._id,
        branchId: target.branchId,
        zoneId: target.zoneId || null,
        employeeId: target.employeeId,
        period: target.period,
        dateFrom: target.dateFrom,
        dateTo: target.dateTo,
        targetAmount: target.targetAmount || 0,
        actualBillingAmount: snapshot.achievedAmount || 0,
        archivedAt: new Date(),
      })
    }
    await softDeleteBranchEmployeeTargetById(target._id)
  }
  return {
    zoneProcessed: expiredZone.length,
    employeeProcessed: expiredEmployee.length,
  }
}
