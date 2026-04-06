import PoEntryModel from '../../models/poEntry.model.js'
import BillingEntryModel from '../../models/billingEntry.model.js'
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
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999))
  let start = null
  if (period === 'daily') {
    start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0))
  } else if (period === 'weekly') {
    start = new Date(end)
    start.setUTCDate(start.getUTCDate() - 6)
    start.setUTCHours(0, 0, 0, 0)
  } else if (period === 'monthly') {
    start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0))
  }
  return { start, end }
}

const buildDateFilter = ({ period = 'all', dateFrom = '', dateTo = '' }) => {
  let fromD = dateFrom && String(dateFrom).trim() ? startOfUtcDay(dateFrom) : null
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
      errorCodes.bad_request,
    )
  }

  if (!fromD && !toD) return {}

  const createdAt = {}
  if (fromD) createdAt.$gte = fromD
  if (toD) createdAt.$lte = toD
  return { entryDate: createdAt }
}

export const createPoEntry = async ({
  poNumber = '',
  companyId,
  salespersonId,
  amount,
  entryDate,
  remark = '',
  branchId = null,
  created_by = null,
}) => {
  const doc = await PoEntryModel.create({
    poNumber: String(poNumber || '').trim().toUpperCase(),
    companyId,
    salespersonId,
    amount: Number(amount) || 0,
    entryDate: entryDate ? new Date(entryDate) : new Date(),
    remark: String(remark || '').trim(),
    branchId: branchId || null,
    created_by: created_by || null,
  })
  return doc.toObject()
}

export const createBillingEntry = async ({
  billingNumber = '',
  companyId,
  salespersonId,
  amount,
  entryDate,
  remark = '',
  branchId = null,
  created_by = null,
}) => {
  const doc = await BillingEntryModel.create({
    billingNumber: String(billingNumber || '').trim().toUpperCase(),
    companyId,
    salespersonId,
    amount: Number(amount) || 0,
    entryDate: entryDate ? new Date(entryDate) : new Date(),
    remark: String(remark || '').trim(),
    branchId: branchId || null,
    created_by: created_by || null,
  })
  return doc.toObject()
}

export const getPoBillingAnalytics = async ({
  period = 'all',
  dateFrom = '',
  dateTo = '',
  tab = 'po',
  pageNumber = 1,
  pageSize = 10,
  branchFilter = {},
}) => {
  const page = Math.max(1, parseInt(pageNumber))
  const limit = Math.min(100, Math.max(1, parseInt(pageSize)))
  const skip = (page - 1) * limit

  const dateFilter = buildDateFilter({ period, dateFrom, dateTo })
  const poFilter = { isDeleted: false, ...branchFilter, ...dateFilter }
  const billingFilter = { isDeleted: false, ...branchFilter, ...dateFilter }

  const [totalPoCount, totalBillingCount, poAmountAgg, billingAmountAgg] = await Promise.all([
    PoEntryModel.countDocuments(poFilter),
    BillingEntryModel.countDocuments(billingFilter),
    PoEntryModel.aggregate([
      { $match: poFilter },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    BillingEntryModel.aggregate([
      { $match: billingFilter },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ])

  const poAmount = poAmountAgg?.[0]?.total || 0
  const billingAmount = billingAmountAgg?.[0]?.total || 0

  const activeModel = tab === 'billing' ? BillingEntryModel : PoEntryModel
  const activeFilter = tab === 'billing' ? billingFilter : poFilter
  const totalItems = tab === 'billing' ? totalBillingCount : totalPoCount

  let rows = await activeModel
    .find(activeFilter)
    .populate('companyId', 'name')
    .populate('salespersonId', 'name')
    .sort({ entryDate: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()

  rows = rows.map((row) => ({
    _id: row._id,
    number: tab === 'billing' ? row.billingNumber || '' : row.poNumber || '',
    companyId: row.companyId?._id || row.companyId || null,
    companyName: row.companyId?.name || '-',
    salespersonId: row.salespersonId?._id || row.salespersonId || null,
    salespersonName: row.salespersonId?.name || '-',
    amount: Number(row.amount) || 0,
    entryDate: row.entryDate || row.createdAt,
    remark: row.remark || '',
    createdAt: row.createdAt,
  }))

  const totalPages = Math.max(1, Math.ceil(totalItems / limit))
  return {
    metrics: {
      totalPoCount,
      totalBillingCount,
      poAmount,
      billingAmount,
    },
    table: {
      tab,
      rows,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    },
  }
}
