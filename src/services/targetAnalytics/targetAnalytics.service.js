import QueryModel from '../../models/query.model.js'
import mongoose from 'mongoose'
import QuotationModel from '../../models/quotation.model.js'
import PoEntryModel from '../../models/poEntry.model.js'
import BillingEntryModel from '../../models/billingEntry.model.js'
import EmployeeModel from '../../models/employee.model.js'
import TargetAnalyticsModel from '../../models/targetAnalytics.model.js'
import TargetAnalyticsHistoryModel from '../../models/targetAnalyticsHistory.model.js'
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
    if (Number.isNaN(qty) || Number.isNaN(rate) || qty < 0 || rate < 0) return sum
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

  const [totalQueries, totalQuotation, totalPo, totalBilling, poAmountAgg, billingAmountAgg] =
    await Promise.all([
      QueryModel.countDocuments(queryFilter),
      QuotationModel.countDocuments(quotationFilter),
      PoEntryModel.countDocuments(poFilter),
      BillingEntryModel.countDocuments(billingFilter),
      PoEntryModel.aggregate([{ $match: poFilter }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      BillingEntryModel.aggregate([
        { $match: billingFilter },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ])

  const quotations = await QuotationModel.find(quotationFilter).select('products').lean()
  const quotedAmount = quotations.reduce((sum, q) => sum + computeQuotationAmount(q?.products || []), 0)

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

export const getTargetAnalytics = async ({ branchId, period, dateFrom, dateTo, branchFilter = {} }) => {
  const filter = { isDeleted: false, ...branchFilter }
  if (branchId && !filter.branchId) filter.branchId = branchId
  if (period) filter.period = period
  if (dateFrom) filter.dateFrom = { $gte: startOfUtcDay(dateFrom) }
  if (dateTo) filter.dateTo = { ...(filter.dateTo || {}), $lte: endOfUtcDay(dateTo) }

  const [activeTargets, history] = await Promise.all([
    TargetAnalyticsModel.find(filter).populate('branchId', 'name branchcode').sort({ dateFrom: -1 }).lean(),
    TargetAnalyticsHistoryModel.find(filter)
      .populate('branchId', 'name branchcode')
      .sort({ archivedAt: -1 })
      .limit(200)
      .lean(),
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
  branchFilter = {},
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

  if (branchFilter?.branchId && String(branchFilter.branchId) !== String(branchId)) {
    throw new CustomError(statusCodes.forbidden, 'Branch access denied', errorCodes.forbidden)
  }

  const existing = await TargetAnalyticsModel.findOne({
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

  const created = await TargetAnalyticsModel.create({
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
  const expiredTargets = await TargetAnalyticsModel.find({
    isDeleted: false,
    dateTo: { $lt: now },
  }).lean()

  if (!expiredTargets.length) return { processed: 0 }

  for (const target of expiredTargets) {
    const snapshot = await getMetricsForRange({
      branchId: target.branchId,
      dateFrom: target.dateFrom,
      dateTo: target.dateTo,
    })

    const alreadyArchived = await TargetAnalyticsHistoryModel.findOne({
      sourceTargetId: target._id,
      isDeleted: false,
    }).lean()
    if (!alreadyArchived) {
      await TargetAnalyticsHistoryModel.create({
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

    await TargetAnalyticsModel.updateOne({ _id: target._id }, { $set: { isDeleted: true } })
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
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
    end = new Date(today.getFullYear(), today.getMonth(), Math.min(30, lastDay), 23, 59, 59, 999)
  }

  start.setHours(0, 0, 0, 0)
  if (period === 'weekly') end.setHours(23, 59, 59, 999)

  return { start, end }
}

export const getTargetSummary = async ({ branchId, period = 'weekly', branchFilter = {} }) => {
  if (!branchId) {
    throw new CustomError(statusCodes.badRequest, 'branchId is required', errorCodes.bad_request)
  }

  if (branchFilter?.branchId && String(branchFilter.branchId) !== String(branchId)) {
    throw new CustomError(statusCodes.forbidden, 'Branch access denied', errorCodes.forbidden)
  }

  const branchObjectId = mongoose.Types.ObjectId.isValid(branchId)
    ? new mongoose.Types.ObjectId(branchId)
    : branchId

  const { start, end } = getCurrentPeriodRange(period)
  const targetDoc = await TargetAnalyticsModel.findOne({
    isDeleted: false,
    branchId,
    period,
    dateFrom: { $lte: end },
    dateTo: { $gte: start },
  })
    .sort({ createdAt: -1 })
    .lean()

  const rangeFrom = targetDoc?.dateFrom || start
  const rangeTo = targetDoc?.dateTo || end

  const branchEmployeeRows = await EmployeeModel.find({
    isDeleted: false,
    branchId: branchObjectId,
  })
    .select('_id')
    .lean()
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

  const billingAgg = await BillingEntryModel.aggregate([
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
