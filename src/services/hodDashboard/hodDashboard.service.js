import mongoose from 'mongoose'
import ProductlHodRatesModel, {
  PRODUCTL_HOD_RATE_STATUS,
} from '../../models/productlHodRates.model.js'
import QueryProductModel, {
  PRO_BUCKET_STATUS,
} from '../../models/queryProduct.model.js'
import QuotationModel, {
  QUOTATION_STATUS,
} from '../../models/quotation.model.js'
import PurchaseOrderModel, {
  PURCHASE_ORDER_STATUS,
} from '../../models/purchaseOrder.model.js'
import BillingRequestModel, {
  BILLING_REQUEST_STATUS,
} from '../../models/billingRequest.model.js'
import PoProductModel from '../../models/poProduct.model.js'
import PoPaymentBacklogModel from '../../models/poPaymentBacklog.model.js'
import BillingEntryModel from '../../models/billingEntry.model.js'
import QueryModel from '../../models/query.model.js'
import { computePurchaseOrderFinancials } from '../purchaseOrder/purchaseOrder.service.js'
import { getHodDashboardCards } from '../query/query.service.js'

const DELIVERY_PENDING_SUB_STATUS = 'hod_approval_pending'

/** Quotations that still need HOD attention before they can go to the client. */
const QUOTATION_AWAITING_STATUSES = [
  QUOTATION_STATUS.FULFILLED,
  QUOTATION_STATUS.READY,
]

/** Purchase orders that have not yet been HOD-approved or closed. */
const PO_AWAITING_STATUSES = [
  PURCHASE_ORDER_STATUS.DRAFT,
  PURCHASE_ORDER_STATUS.CONFIRMED,
  PURCHASE_ORDER_STATUS.FULFILLED,
]

const toObjectId = (value) => {
  if (!value) return null
  const raw =
    typeof value === 'object' && value._id != null ? value._id : value
  const str = String(raw).trim()
  return mongoose.Types.ObjectId.isValid(str)
    ? new mongoose.Types.ObjectId(str)
    : null
}

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

/** Resolve the analytics window from explicit dates or a named period. */
const resolveDateRange = ({ dateFrom, dateTo, period }) => {
  let from = dateFrom ? startOfUtcDay(dateFrom) : null
  let to = dateTo ? endOfUtcDay(dateTo) : null

  if (!from && !to && period && period !== 'all') {
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
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
      )
    } else if (period === 'weekly') {
      start = new Date(end)
      start.setUTCDate(start.getUTCDate() - 6)
      start.setUTCHours(0, 0, 0, 0)
    } else if (period === 'monthly') {
      start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    } else if (period === 'yearly') {
      start = new Date(Date.UTC(now.getUTCFullYear(), 0, 1))
    }
    from = start
    to = end
  }

  return { from, to }
}

/** Apply a created/entry-date window onto a filter object. */
const withDateRange = (filter, field, { from, to }) => {
  if (!from && !to) return filter
  filter[field] = {}
  if (from) filter[field].$gte = from
  if (to) filter[field].$lte = to
  return filter
}

const sumAmount = async (Model, match, field = 'amount') => {
  const agg = await Model.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: `$${field}` } } },
  ])
  return Number(agg?.[0]?.total || 0)
}

const groupByStatus = async (Model, match, statusField = 'status') => {
  const rows = await Model.aggregate([
    { $match: match },
    { $group: { _id: `$${statusField}`, count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ])
  return rows.map((r) => ({ status: r._id || 'unknown', count: r.count }))
}

const computeQuotationAmount = (products = []) => {
  if (!Array.isArray(products) || !products.length) return 0
  return products.reduce((sum, item) => {
    if (item?.notAvailable) return sum
    const qty = Number(item?.quantity)
    const rate = Number(item?.rate)
    if (Number.isNaN(qty) || Number.isNaN(rate) || qty < 0 || rate < 0) {
      return sum
    }
    let lineTotal = qty * rate
    if (item?.applyDiscount && item?.discountPercentage != null) {
      lineTotal = Math.max(
        0,
        lineTotal - lineTotal * (Number(item.discountPercentage) / 100)
      )
    }
    return sum + lineTotal
  }, 0)
}

/** Bucket granularity + Mongo date format for the billing trend chart. */
const resolveTrendGranularity = ({ from, to }) => {
  if (!from || !to) return { format: '%Y-%m', unit: 'month' }
  const spanDays = (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)
  if (spanDays <= 31) return { format: '%Y-%m-%d', unit: 'day' }
  if (spanDays <= 366) return { format: '%Y-%m', unit: 'month' }
  return { format: '%Y', unit: 'year' }
}

const getBillingTrend = async (match, range) => {
  const { format } = resolveTrendGranularity(range)
  const rows = await BillingEntryModel.aggregate([
    { $match: match },
    {
      $group: {
        _id: { $dateToString: { format, date: '$entryDate' } },
        amount: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ])
  return rows.map((r) => ({
    label: r._id,
    amount: Number(r.amount || 0),
    count: r.count,
  }))
}

/**
 * HOD dashboard overview — KPIs, financials, charts and the pipeline funnel.
 * `branchId` is optional (HODs may view all branches); when supplied it scopes
 * every branch-aware collection. Pro-bucket / HOD-rate collections have no
 * branchId and are reported globally.
 */
export const getHodOverview = async ({
  branchId = '',
  dateFrom = '',
  dateTo = '',
  period = 'monthly',
  fallbackBranchId = null,
} = {}) => {
  const range = resolveDateRange({ dateFrom, dateTo, period })
  const branchObjectId = toObjectId(branchId)
  const branchMatch = branchObjectId ? { branchId: branchObjectId } : {}

  const createdRange = (extra = {}) =>
    withDateRange({ isDeleted: false, ...branchMatch, ...extra }, 'createdAt', range)
  const entryRange = (extra = {}) =>
    withDateRange({ isDeleted: false, ...branchMatch, ...extra }, 'entryDate', range)

  // ---- Point-in-time pending KPIs (not date-scoped; these are open work) ----
  const [
    pendingHodRates,
    proBucketPendingApproval,
    quotationsAwaitingApproval,
    posAwaitingApproval,
    billingRequestsPending,
    deliveryApprovalsPending,
    paymentBacklogCount,
    paymentBacklogAmount,
  ] = await Promise.all([
    ProductlHodRatesModel.countDocuments({
      isDeleted: false,
      status: PRODUCTL_HOD_RATE_STATUS.HOD_APPROVAL_PENDING,
    }),
    QueryProductModel.countDocuments({
      isDeleted: false,
      status: PRO_BUCKET_STATUS.FULFILLED,
      hodApproved: false,
    }),
    QuotationModel.countDocuments({
      isDeleted: false,
      ...branchMatch,
      status: { $in: QUOTATION_AWAITING_STATUSES },
    }),
    PurchaseOrderModel.countDocuments({
      isDeleted: false,
      ...branchMatch,
      status: { $in: PO_AWAITING_STATUSES },
    }),
    BillingRequestModel.countDocuments({
      isDeleted: false,
      ...branchMatch,
      status: BILLING_REQUEST_STATUS.HOD_APPROVAL_PENDING,
    }),
    PoProductModel.countDocuments({
      isDeleted: false,
      ...branchMatch,
      deliverySubStatus: DELIVERY_PENDING_SUB_STATUS,
    }),
    PoPaymentBacklogModel.countDocuments({
      isDeleted: false,
      ...branchMatch,
      is_settled: false,
    }),
    sumAmount(PoPaymentBacklogModel, {
      isDeleted: false,
      ...branchMatch,
      is_settled: false,
    }),
  ])

  // ---- Pipeline funnel + amounts (date + branch scoped) ----
  const [
    queriesCount,
    quotationsCount,
    poCount,
    billingCount,
    billingAmount,
    quotationDocs,
    poDocs,
  ] = await Promise.all([
    QueryModel.countDocuments(createdRange()),
    QuotationModel.countDocuments(createdRange()),
    PurchaseOrderModel.countDocuments(createdRange()),
    BillingEntryModel.countDocuments(entryRange()),
    sumAmount(BillingEntryModel, entryRange()),
    QuotationModel.find(createdRange()).select('products').lean(),
    PurchaseOrderModel.find(createdRange())
      .select('products freightCharge packingCharge')
      .lean(),
  ])

  const quotedAmount = quotationDocs.reduce(
    (sum, q) => sum + computeQuotationAmount(q?.products || []),
    0
  )
  const poAmount = poDocs.reduce(
    (sum, po) => sum + computePurchaseOrderFinancials(po).grandTotal,
    0
  )

  // ---- Charts ----
  const [quotationStatus, poStatus, proBucketStatus, billingTrend] =
    await Promise.all([
      groupByStatus(QuotationModel, createdRange()),
      groupByStatus(PurchaseOrderModel, createdRange()),
      groupByStatus(
        QueryProductModel,
        withDateRange({ isDeleted: false }, 'createdAt', range)
      ),
      getBillingTrend(entryRange(), range),
    ])

  // ---- Target vs achievement (weekly / monthly) ----
  const cardsBranchId = branchObjectId
    ? String(branchObjectId)
    : fallbackBranchId
      ? String(
          typeof fallbackBranchId === 'object' && fallbackBranchId._id != null
            ? fallbackBranchId._id
            : fallbackBranchId
        )
      : null
  const targetCards = await getHodDashboardCards({ branchId: cardsBranchId })

  return {
    filters: {
      branchId: branchObjectId ? String(branchObjectId) : '',
      period,
      dateFrom: range.from ? range.from.toISOString() : null,
      dateTo: range.to ? range.to.toISOString() : null,
    },
    kpis: {
      pendingHodRates,
      proBucketPendingApproval,
      quotationsAwaitingApproval,
      posAwaitingApproval,
      billingRequestsPending,
      deliveryApprovalsPending,
      paymentBacklogCount,
      paymentBacklogAmount,
    },
    pipeline: {
      queries: queriesCount,
      quotations: quotationsCount,
      purchaseOrders: poCount,
      billings: billingCount,
    },
    financials: {
      quotedAmount,
      poAmount,
      billingAmount,
      paymentBacklogAmount,
      weeklyTarget: targetCards.weeklyTarget,
      weeklyBilling: targetCards.weeklyBilling,
      monthlyTarget: targetCards.monthlyTarget,
      monthlyBilling: targetCards.monthlyBilling,
    },
    charts: {
      quotationStatus,
      poStatus,
      proBucketStatus,
      billingTrend,
    },
  }
}

/** Format a paginated action-queue response. */
const paginate = (rows, totalItems, page, limit) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / limit))
  return {
    rows,
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

/**
 * Paginated HOD action queues — the items the HOD must review/approve.
 * `type` selects the workflow; `status` further narrows within that workflow.
 */
export const getHodPendingItems = async ({
  type,
  branchId = '',
  status = '',
  search = '',
  dateFrom = '',
  dateTo = '',
  pageNumber = 1,
  pageSize = 10,
} = {}) => {
  const page = Math.max(1, parseInt(pageNumber, 10) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 10))
  const skip = (page - 1) * limit
  const range = resolveDateRange({ dateFrom, dateTo, period: 'all' })
  const branchObjectId = toObjectId(branchId)
  const branchMatch = branchObjectId ? { branchId: branchObjectId } : {}
  const trimmedSearch = String(search || '').trim()

  if (type === 'quotations') {
    const filter = withDateRange(
      {
        isDeleted: false,
        ...branchMatch,
        status: status || { $in: QUOTATION_AWAITING_STATUSES },
      },
      'createdAt',
      range
    )
    if (trimmedSearch) {
      filter.quotationCode = { $regex: trimmedSearch, $options: 'i' }
    }
    const [totalItems, docs] = await Promise.all([
      QuotationModel.countDocuments(filter),
      QuotationModel.find(filter)
        .select('quotationCode status companyInfo products createdAt branchId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ])
    const rows = docs.map((q) => ({
      _id: q._id,
      code: q.quotationCode || '-',
      company: q.companyInfo?.name || '-',
      amount: computeQuotationAmount(q?.products || []),
      status: q.status || '-',
      createdAt: q.createdAt,
    }))
    return paginate(rows, totalItems, page, limit)
  }

  if (type === 'purchase_orders') {
    const filter = withDateRange(
      {
        isDeleted: false,
        ...branchMatch,
        status: status || { $in: PO_AWAITING_STATUSES },
      },
      'createdAt',
      range
    )
    if (trimmedSearch) {
      filter.poCode = { $regex: trimmedSearch, $options: 'i' }
    }
    const [totalItems, docs] = await Promise.all([
      PurchaseOrderModel.countDocuments(filter),
      PurchaseOrderModel.find(filter)
        .select(
          'poCode status companyInfo products freightCharge packingCharge createdAt branchId'
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ])
    const rows = docs.map((po) => ({
      _id: po._id,
      code: po.poCode || '-',
      company: po.companyInfo?.name || '-',
      amount: computePurchaseOrderFinancials(po).grandTotal,
      status: po.status || '-',
      createdAt: po.createdAt,
    }))
    return paginate(rows, totalItems, page, limit)
  }

  if (type === 'pro_bucket') {
    const filter = withDateRange(
      {
        isDeleted: false,
        status: status || PRO_BUCKET_STATUS.FULFILLED,
        hodApproved: false,
      },
      'createdAt',
      range
    )
    if (trimmedSearch) {
      filter.$or = [
        { queryCode: { $regex: trimmedSearch, $options: 'i' } },
        { productName: { $regex: trimmedSearch, $options: 'i' } },
      ]
    }
    const [totalItems, docs] = await Promise.all([
      QueryProductModel.countDocuments(filter),
      QueryProductModel.find(filter)
        .select('queryCode productName status quantity unit rates createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ])
    const rows = docs.map((line) => ({
      _id: line._id,
      code: line.queryCode || '-',
      productName: line.productName || '-',
      quantity: line.quantity,
      unit: line.unit || '',
      ratesCount: Array.isArray(line.rates) ? line.rates.length : 0,
      status: line.status || '-',
      createdAt: line.createdAt,
    }))
    return paginate(rows, totalItems, page, limit)
  }

  if (type === 'billing_requests') {
    const filter = withDateRange(
      {
        isDeleted: false,
        ...branchMatch,
        status: status || BILLING_REQUEST_STATUS.HOD_APPROVAL_PENDING,
      },
      'createdAt',
      range
    )
    if (trimmedSearch) {
      filter.$or = [
        { billingRequestCode: { $regex: trimmedSearch, $options: 'i' } },
        { poCode: { $regex: trimmedSearch, $options: 'i' } },
      ]
    }
    const [totalItems, docs] = await Promise.all([
      BillingRequestModel.countDocuments(filter),
      BillingRequestModel.find(filter)
        .select('billingRequestCode poCode status products createdAt branchId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ])
    const rows = docs.map((br) => ({
      _id: br._id,
      code: br.billingRequestCode || '-',
      poCode: br.poCode || '-',
      productCount: Array.isArray(br.products) ? br.products.length : 0,
      amount: Array.isArray(br.products)
        ? br.products.reduce((s, p) => s + (Number(p.amount) || 0), 0)
        : 0,
      status: br.status || '-',
      createdAt: br.createdAt,
    }))
    return paginate(rows, totalItems, page, limit)
  }

  if (type === 'deliveries') {
    const filter = withDateRange(
      {
        isDeleted: false,
        ...branchMatch,
        deliverySubStatus: status || DELIVERY_PENDING_SUB_STATUS,
      },
      'updatedAt',
      range
    )
    if (trimmedSearch) {
      filter.$or = [
        { poCode: { $regex: trimmedSearch, $options: 'i' } },
        { productName: { $regex: trimmedSearch, $options: 'i' } },
      ]
    }
    const [totalItems, docs] = await Promise.all([
      PoProductModel.countDocuments(filter),
      PoProductModel.find(filter)
        .select(
          'poCode productName quantity unit deliverySubStatus companyInfo updatedAt'
        )
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ])
    const rows = docs.map((line) => ({
      _id: line._id,
      code: line.poCode || '-',
      productName: line.productName || '-',
      company: line.companyInfo?.name || '-',
      quantity: line.quantity,
      unit: line.unit || '',
      status: line.deliverySubStatus || '-',
      createdAt: line.updatedAt,
    }))
    return paginate(rows, totalItems, page, limit)
  }

  return paginate([], 0, page, limit)
}
