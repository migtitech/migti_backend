import mongoose from 'mongoose'
import QueryModel from '../../models/query.model.js'
import QuotationModel, { QUOTATION_STATUS } from '../../models/quotation.model.js'
import PurchaseOrderModel, { PURCHASE_ORDER_STATUS } from '../../models/purchaseOrder.model.js'
import PoEntryModel from '../../models/poEntry.model.js'
import BillingEntryModel from '../../models/billingEntry.model.js'
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
import {
  appendConvertedQuotationOnQuery,
  createQuotationFromQuery,
  getQuotationByQueryId,
} from '../quotation/quotation.service.js'
import { createDraftTasksForQueryProducts } from '../taskManagement/taskManagement.service.js'
import { getNextSequence } from '../codeSequence/codeSequence.service.js'
import {
  getTargetAnalytics as getTargetAnalyticsData,
  upsertTargetAnalytics as upsertTargetAnalyticsData,
  getTargetSummary as getTargetSummaryData,
  getZoneTargetAnalytics as getZoneTargetAnalyticsData,
  upsertZoneTargetAnalytics as upsertZoneTargetAnalyticsData,
  getZoneTargetSummary as getZoneTargetSummaryData,
  getEmployeeTargetAnalytics as getEmployeeTargetAnalyticsData,
  upsertEmployeeTargetAnalytics as upsertEmployeeTargetAnalyticsData,
  getEmployeeTargetSummary as getEmployeeTargetSummaryData,
} from '../targetAnalytics/targetAnalytics.service.js'
import { computePurchaseOrderFinancials } from '../purchaseOrder/purchaseOrder.service.js'
import BranchEmployeeTargetModel from '../../models/branchEmployeeTarget.model.js'
import TargetAnalyticsModel from '../../models/targetAnalytics.model.js'
import { assertSubZoneBelongsToArea } from '../subZone/subZone.service.js'
import { resolveQueryAccessFilter } from '../../core/helpers/queryAccess.js'

const OBJECT_ID_REGEX = /^[a-fA-F0-9]{24}$/

const validateCompanyInfoSubZone = async (companyInfo, branchId) => {
  if (!companyInfo || typeof companyInfo !== 'object') return
  const sub = companyInfo.subZoneId
  const areaId = companyInfo.area
  if (!sub || String(sub).trim() === '') return
  const bf =
    branchId && mongoose.Types.ObjectId.isValid(String(branchId))
      ? { branchId: new mongoose.Types.ObjectId(String(branchId)) }
      : {}
  await assertSubZoneBelongsToArea({ subZoneId: sub, areaId, branchFilter: bf })
}

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

const dedupeConvertedQuotationRefs = (refs = []) => {
  const seen = new Set()
  const out = []
  for (const ref of refs) {
    const id = String(ref?.quotationId ?? ref?._id ?? '')
    if (!id || seen.has(id)) continue
    seen.add(id)
    out.push({
      quotationId: ref.quotationId ?? ref._id,
      quotationCode: String(ref?.quotationCode ?? '').trim(),
    })
  }
  return out
}

export const mergeQuotationRefsForQueries = async (queries = []) => {
  if (!queries?.length) return queries
  const ids = queries.map((q) => q._id).filter(Boolean)
  if (!ids.length) return queries
  const rows = await QuotationModel.find({
    queryId: { $in: ids },
    isDeleted: false,
  })
    .select('queryId quotationCode')
    .lean()
  const byQuery = new Map()
  for (const r of rows) {
    const k = String(r.queryId)
    if (!byQuery.has(k)) byQuery.set(k, [])
    byQuery.get(k).push({
      quotationId: r._id,
      quotationCode: r.quotationCode || '',
    })
  }
  return queries.map((q) => {
    const fromDb = byQuery.get(String(q._id)) || []
    const stored = Array.isArray(q.convertedQuotations) ? q.convertedQuotations : []
    const merged = dedupeConvertedQuotationRefs([...stored, ...fromDb])
    return { ...q, convertedQuotations: merged }
  })
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

  await validateCompanyInfoSubZone(companyInfo, branchId)

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
  try {
    await createDraftTasksForQueryProducts({ query: queryObj })
  } catch (err) {
    console.error('Failed to create draft tasks for query products', err)
  }

  return queryObj
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

export const listQueries = async ({
  pageNumber = 1,
  pageSize = 10,
  search = '',
  status = '',
  dateFrom = '',
  dateTo = '',
  industryId = '',
  branchFilter = {},
  currentUserId = null,
  isFullAccessRole = true,
  role = '',
}) => {
  const page = Math.max(1, parseInt(pageNumber))
  const limit = Math.min(100, Math.max(1, parseInt(pageSize)))
  const skip = (page - 1) * limit

  const ownershipFilter = await resolveQueryAccessFilter({ currentUserId, isFullAccessRole, role, branchFilter })
  const filter = { isDeleted: false, ...branchFilter, ...ownershipFilter }
  if (industryId && String(industryId).trim() && mongoose.Types.ObjectId.isValid(industryId)) {
    filter.industry_id = new mongoose.Types.ObjectId(String(industryId).trim())
  }
  if (status && status.trim()) {
    filter.status = status.trim()
  }

  let fromD = dateFrom && String(dateFrom).trim() ? startOfUtcDay(dateFrom) : null
  let toD = dateTo && String(dateTo).trim() ? endOfUtcDay(dateTo) : null
  if (fromD && toD && fromD > toD) {
    throw new CustomError(
      statusCodes.badRequest,
      'dateFrom must be on or before dateTo',
      errorCodes.bad_request,
    )
  }
  if (fromD || toD) {
    filter.createdAt = {}
    if (fromD) filter.createdAt.$gte = fromD
    if (toD) filter.createdAt.$lte = toD
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

  const queriesWithRefs = await mergeQuotationRefsForQueries(queries)

  const totalPages = Math.ceil(totalItems / limit)

  return {
    queries: queriesWithRefs,
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
  role = '',
}) => {
  const ownershipFilter = await resolveQueryAccessFilter({ currentUserId, isFullAccessRole, role, branchFilter })
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

  const [withRefs] = await mergeQuotationRefsForQueries([query])
  return withRefs
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
  role = '',
}) => {
  const ownershipFilter = await resolveQueryAccessFilter({ currentUserId, isFullAccessRole, role, branchFilter })
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
  role = '',
}) => {
  const ownershipFilter = await resolveQueryAccessFilter({ currentUserId, isFullAccessRole, role, branchFilter })
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
  close_remark,
  branchFilter = {},
  currentUserId = null,
  isFullAccessRole = true,
  role = '',
}) => {
  const ownershipFilter = await resolveQueryAccessFilter({ currentUserId, isFullAccessRole, role, branchFilter })
  const existing = await QueryModel.findOne({ _id: queryId, isDeleted: false, ...branchFilter, ...ownershipFilter }).lean()
  if (!existing) {
    throw new CustomError(
      statusCodes.notFound,
      'Query not found',
      errorCodes.not_found,
    )
  }

  if (existing.status === 'closed') {
    throw new CustomError(
      statusCodes.badRequest,
      'This query is closed and cannot be updated',
      errorCodes.bad_request,
    )
  }

  const updatePayload = {}
  if (companyInfo !== undefined) {
    const mergedCi = { ...(existing.companyInfo || {}), ...companyInfo }
    await validateCompanyInfoSubZone(mergedCi, existing.branchId)
    updatePayload.companyInfo = companyInfo
  }
  if (industry_id !== undefined) updatePayload.industry_id = industry_id || null
  if (products !== undefined) updatePayload.products = mapProductsWithImages(products)
  if (delivery !== undefined) updatePayload.delivery = delivery
  if (status !== undefined) updatePayload.status = status
  if (close_remark !== undefined) updatePayload.close_remark = close_remark

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
  role = '',
}) => {
  const ownershipFilter = await resolveQueryAccessFilter({ currentUserId, isFullAccessRole, role, branchFilter })
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

export const linkConvertedQuotationToQuery = async ({
  queryId,
  quotationId,
  quotationCode = '',
  branchFilter = {},
  currentUserId = null,
  isFullAccessRole = true,
  role = '',
}) => {
  const ownershipFilter = await resolveQueryAccessFilter({ currentUserId, isFullAccessRole, role, branchFilter })
  const existing = await QueryModel.findOne({
    _id: queryId,
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

  await appendConvertedQuotationOnQuery(queryId, quotationId, quotationCode)

  return {
    queryId: String(queryId),
    quotationId: String(quotationId),
    quotationCode: String(quotationCode || '').trim(),
  }
}

export const convertQueryToQuotation = async ({
  queryCode,
  forceNewQuotation = false,
  created_by,
  branchFilter = {},
  remark,
  products,
  isFullAccessRole = true,
  role = '',
}) => {
  const ownershipFilter = await resolveQueryAccessFilter({
    currentUserId: created_by,
    isFullAccessRole,
    role,
    branchFilter,
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

  if (existing.status === 'closed') {
    throw new CustomError(
      statusCodes.badRequest,
      'Cannot convert a closed query to quotation',
      errorCodes.bad_request,
    )
  }

  let quotation = null
  if (!forceNewQuotation) {
    quotation = await getQuotationByQueryId({ queryId: existing._id, branchFilter })
  }
  if (!quotation) {
    quotation = await createQuotationFromQuery({
      queryId: existing._id,
      created_by,
      branchId: existing.branchId,
      branchFilter,
      remark,
      productsOverride: products,
      reuseExisting: !forceNewQuotation,
    })
  }

  await appendConvertedQuotationOnQuery(
    existing._id,
    quotation._id,
    quotation.quotationCode,
  )

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

const getDayRange = () => {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return { start, end }
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

export const getTodayDashboardStats = async ({
  branchFilter = {},
  currentUserId = null,
  isFullAccessRole = true,
  role = '',
}) => {
  const { start, end } = getDayRange()
  const ownershipFilter = await resolveQueryAccessFilter({ currentUserId, isFullAccessRole, role, branchFilter })

  const queryFilter = {
    isDeleted: false,
    ...branchFilter,
    ...ownershipFilter,
    createdAt: { $gte: start, $lt: end },
  }

  const todayQueryCount = await QueryModel.countDocuments(queryFilter)

  let quotationFilter = {
    isDeleted: false,
    ...branchFilter,
    createdAt: { $gte: start, $lt: end },
  }

  if (currentUserId && !isFullAccessRole) {
    const ownQueryIds = await QueryModel.find({
      isDeleted: false,
      ...branchFilter,
      ...ownershipFilter,
    })
      .select('_id')
      .lean()

    const ids = ownQueryIds.map((q) => q._id)
    quotationFilter = {
      ...quotationFilter,
      queryId: { $in: ids },
    }
  }

  const todayQuotationCount = await QuotationModel.countDocuments(quotationFilter)
  const todayQuotations = await QuotationModel.find(quotationFilter)
    .select('products')
    .lean()

  const todayQuotedAmount = todayQuotations.reduce(
    (sum, q) => sum + computeQuotationAmount(q?.products || []),
    0,
  )

  return {
    todayQueryCount,
    todayQuotationCount,
    todayQuotedAmount,
  }
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
  } else if (period === 'yearly') {
    start = new Date(Date.UTC(now.getUTCFullYear(), 0, 1, 0, 0, 0, 0))
  }
  return { start, end }
}

const asObjectIdString = (value) => {
  if (!value) return ''
  if (typeof value === 'object' && value._id) return String(value._id)
  return String(value)
}

export const getBranchAnalytics = async ({
  branchId = '',
  period = 'all',
  dateFrom = '',
  dateTo = '',
  tab = 'queries',
  pageNumber = 1,
  pageSize = 10,
  branchFilter = {},
  currentUserId = null,
  isFullAccessRole = true,
  role = '',
}) => {
  const page = Math.max(1, parseInt(pageNumber))
  const limit = Math.min(100, Math.max(1, parseInt(pageSize)))
  const skip = (page - 1) * limit
  const ownershipFilter = await resolveQueryAccessFilter({ currentUserId, isFullAccessRole, role, branchFilter })

  const queryBaseFilter = { isDeleted: false, ...ownershipFilter, ...branchFilter }
  const quotationBaseFilter = { isDeleted: false, ...branchFilter }
  const poBaseFilter = { isDeleted: false, ...branchFilter }
  const billingBaseFilter = { isDeleted: false, ...branchFilter }

  if (branchId && String(branchId).trim() && !queryBaseFilter.branchId) {
    queryBaseFilter.branchId = branchId
  }
  if (branchId && String(branchId).trim() && !quotationBaseFilter.branchId) {
    quotationBaseFilter.branchId = branchId
  }
  if (branchId && String(branchId).trim() && !poBaseFilter.branchId) {
    poBaseFilter.branchId = branchId
  }
  if (branchId && String(branchId).trim() && !billingBaseFilter.branchId) {
    billingBaseFilter.branchId = branchId
  }

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
  if (fromD || toD) {
    queryBaseFilter.createdAt = {}
    quotationBaseFilter.createdAt = {}
    poBaseFilter.entryDate = {}
    billingBaseFilter.entryDate = {}
    if (fromD) {
      queryBaseFilter.createdAt.$gte = fromD
      quotationBaseFilter.createdAt.$gte = fromD
      poBaseFilter.entryDate.$gte = fromD
      billingBaseFilter.entryDate.$gte = fromD
    }
    if (toD) {
      queryBaseFilter.createdAt.$lte = toD
      quotationBaseFilter.createdAt.$lte = toD
      poBaseFilter.entryDate.$lte = toD
      billingBaseFilter.entryDate.$lte = toD
    }
  }

  if (currentUserId && !isFullAccessRole) {
    const ownQueryIds = await QueryModel.find({
      isDeleted: false,
      ...branchFilter,
      ...ownershipFilter,
    })
      .select('_id')
      .lean()
    quotationBaseFilter.queryId = { $in: ownQueryIds.map((q) => q._id) }
  }

  const [totalQueries, totalQuotation, totalPo, totalBilling, poAmountAgg, billingAmountAgg] = await Promise.all([
    QueryModel.countDocuments(queryBaseFilter),
    QuotationModel.countDocuments(quotationBaseFilter),
    PoEntryModel.countDocuments(poBaseFilter),
    BillingEntryModel.countDocuments(billingBaseFilter),
    PoEntryModel.aggregate([
      { $match: poBaseFilter },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    BillingEntryModel.aggregate([
      { $match: billingBaseFilter },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ])

  const quotedAmountDocs = await QuotationModel.find(quotationBaseFilter)
    .select('products')
    .lean()
  const quotedAmount = quotedAmountDocs.reduce(
    (sum, q) => sum + computeQuotationAmount(q?.products || []),
    0,
  )
  const poAmount = poAmountAgg?.[0]?.total || 0
  const billingAmount = billingAmountAgg?.[0]?.total || 0

  let rows = []
  let totalItems = 0
  if (tab === 'queries') {
    totalItems = totalQueries
    rows = await QueryModel.find(queryBaseFilter)
      .select('queryCode status companyInfo createdAt branchId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
    rows = rows.map((item) => ({
      _id: item._id,
      queryCode: item.queryCode || '',
      status: item.status || '',
      companyInfo: item.companyInfo || {},
      branchId: asObjectIdString(item.branchId),
      createdAt: item.createdAt,
    }))
  } else if (tab === 'quotations') {
    totalItems = totalQuotation
    rows = await QuotationModel.find(quotationBaseFilter)
      .select('quotationCode status companyInfo createdAt branchId totalAmount products')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
    rows = rows.map((item) => ({
      _id: item._id,
      quotationCode: item.quotationCode || '',
      status: item.status || '',
      companyInfo: item.companyInfo || {},
      branchId: asObjectIdString(item.branchId),
      totalAmount: typeof item.totalAmount === 'number'
        ? item.totalAmount
        : computeQuotationAmount(item?.products || []),
      createdAt: item.createdAt,
    }))
  } else if (tab === 'po') {
    totalItems = totalPo
    rows = await PoEntryModel.find(poBaseFilter)
      .select('poNumber amount entryDate remark companyId salespersonId createdAt')
      .populate('companyId', 'name')
      .populate('salespersonId', 'name')
      .sort({ entryDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
    rows = rows.map((item) => ({
      _id: item._id,
      poNumber: item.poNumber || '',
      companyName: item.companyId?.name || '-',
      salespersonName: item.salespersonId?.name || '-',
      amount: Number(item.amount) || 0,
      entryDate: item.entryDate || item.createdAt,
      remark: item.remark || '',
    }))
  } else if (tab === 'billing') {
    totalItems = totalBilling
    rows = await BillingEntryModel.find(billingBaseFilter)
      .select('billingNumber amount entryDate remark companyId salespersonId createdAt')
      .populate('companyId', 'name')
      .populate('salespersonId', 'name')
      .sort({ entryDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
    rows = rows.map((item) => ({
      _id: item._id,
      billingNumber: item.billingNumber || '',
      companyName: item.companyId?.name || '-',
      salespersonName: item.salespersonId?.name || '-',
      amount: Number(item.amount) || 0,
      entryDate: item.entryDate || item.createdAt,
      remark: item.remark || '',
    }))
  }

  const totalPages = Math.max(1, Math.ceil(totalItems / limit))

  return {
    metrics: {
      totalQueries,
      totalQuotation,
      quotedAmount,
      totalPo,
      poAmount,
      totalBilling,
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

export const getTargetAnalytics = async (params = {}) => {
  return getTargetAnalyticsData(params)
}

export const upsertTargetAnalytics = async (params = {}) => {
  return upsertTargetAnalyticsData(params)
}

export const getTargetSummary = async (params = {}) => {
  return getTargetSummaryData(params)
}

export const getZoneTargetAnalytics = async (params = {}) => getZoneTargetAnalyticsData(params)
export const upsertZoneTargetAnalytics = async (params = {}) => upsertZoneTargetAnalyticsData(params)
export const getZoneTargetSummary = async (params = {}) => getZoneTargetSummaryData(params)
export const getEmployeeTargetAnalytics = async (params = {}) => getEmployeeTargetAnalyticsData(params)
export const upsertEmployeeTargetAnalytics = async (params = {}) => upsertEmployeeTargetAnalyticsData(params)
export const getEmployeeTargetSummary = async (params = {}) => getEmployeeTargetSummaryData(params)

/** Same calendar windows as branch target analytics (targetAnalytics.service getCurrentPeriodRange). */
const getBranchTargetCalendarRange = (period) => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  let start = new Date(today)
  let end = new Date(today)

  if (period === 'weekly') {
    start.setDate(today.getDate() - 6)
  } else {
    start = new Date(today.getFullYear(), today.getMonth(), 1, 0, 0, 0, 0)
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
    end = new Date(today.getFullYear(), today.getMonth(), Math.min(30, lastDay), 23, 59, 59, 999)
  }

  start.setHours(0, 0, 0, 0)
  if (period === 'weekly') end.setHours(23, 59, 59, 999)

  return { start, end }
}

const getBranchTargetDocForCurrentWindow = async (branchId, period, start, end) => {
  return TargetAnalyticsModel.findOne({
    isDeleted: false,
    branchId,
    period,
    dateFrom: { $lte: end },
    dateTo: { $gte: start },
  })
    .sort({ createdAt: -1 })
    .lean()
}

/** Billing total for branch: strict branchId on billingentries, entryDate in range. */
const getBranchBillingTotalByEntryDate = async (branchId, rangeFrom, rangeTo) => {
  if (!branchId || !mongoose.Types.ObjectId.isValid(String(branchId))) return 0
  const bid = new mongoose.Types.ObjectId(String(branchId))
  const match = {
    isDeleted: false,
    branchId: bid,
    entryDate: { $gte: rangeFrom, $lte: rangeTo },
  }
  const agg = await BillingEntryModel.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ])
  return Number(agg?.[0]?.total || 0)
}

const resolveHodPeriod = async (branchId, period) => {
  const { start, end } = getBranchTargetCalendarRange(period)
  const targetDoc = await getBranchTargetDocForCurrentWindow(branchId, period, start, end)
  const rangeFrom = targetDoc?.dateFrom ? new Date(targetDoc.dateFrom) : start
  const rangeTo = targetDoc?.dateTo ? new Date(targetDoc.dateTo) : end
  const targetAmount = Number(targetDoc?.targetAmount || 0)
  return { targetAmount, rangeFrom, rangeTo }
}

/** HOD dashboard: branch targets from targetAnalytics; billing sums from billingentries by branchId + entryDate. */
export const getHodDashboardCards = async ({ branchId }) => {
  if (!branchId || !mongoose.Types.ObjectId.isValid(String(branchId))) {
    return {
      weeklyTarget: 0,
      weeklyBilling: 0,
      monthlyTarget: 0,
      monthlyBilling: 0,
      weeklyFrom: null,
      weeklyTo: null,
      monthlyFrom: null,
      monthlyTo: null,
      branchId: '',
    }
  }

  const [weekly, monthly] = await Promise.all([
    resolveHodPeriod(branchId, 'weekly'),
    resolveHodPeriod(branchId, 'monthly'),
  ])

  const [weeklyBilling, monthlyBilling] = await Promise.all([
    getBranchBillingTotalByEntryDate(branchId, weekly.rangeFrom, weekly.rangeTo),
    getBranchBillingTotalByEntryDate(branchId, monthly.rangeFrom, monthly.rangeTo),
  ])

  return {
    weeklyTarget: weekly.targetAmount,
    weeklyBilling,
    monthlyTarget: monthly.targetAmount,
    monthlyBilling,
    weeklyFrom: weekly.rangeFrom.toISOString(),
    weeklyTo: weekly.rangeTo.toISOString(),
    monthlyFrom: monthly.rangeFrom.toISOString(),
    monthlyTo: monthly.rangeTo.toISOString(),
    branchId: String(branchId),
  }
}

/** Weekly / monthly windows for employee target + billing (aligned with target analytics). */
const getSalesTargetWeeklyMonthlyRanges = () => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const weeklyFrom = new Date(today)
  weeklyFrom.setDate(today.getDate() - 6)
  weeklyFrom.setHours(0, 0, 0, 0)
  const weeklyTo = new Date(today)
  weeklyTo.setHours(23, 59, 59, 999)

  const monthlyFrom = new Date(today.getFullYear(), today.getMonth(), 1, 0, 0, 0, 0)
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
  const monthlyTo = new Date(
    today.getFullYear(),
    today.getMonth(),
    Math.min(30, lastDay),
    23,
    59,
    59,
    999
  )

  return { weeklyFrom, weeklyTo, monthlyFrom, monthlyTo }
}

const getEmployeeTargetAmountForPeriod = async ({
  employeeId,
  branchId = null,
  period,
  rangeFrom,
  rangeTo,
}) => {
  const filter = {
    isDeleted: false,
    employeeId,
    period,
    dateFrom: { $lte: rangeTo },
    dateTo: { $gte: rangeFrom },
  }
  if (branchId) filter.branchId = branchId
  const targetDoc = await BranchEmployeeTargetModel.findOne(filter)
    .sort({ createdAt: -1 })
    .lean()
  return Number(targetDoc?.targetAmount || 0)
}

const getEmployeeBillingForRange = async ({ employeeId, rangeFrom, rangeTo }) => {
  if (!employeeId || !mongoose.Types.ObjectId.isValid(String(employeeId))) {
    return 0
  }
  const spId = new mongoose.Types.ObjectId(String(employeeId))
  const billingFilter = {
    isDeleted: false,
    entryDate: { $gte: rangeFrom, $lte: rangeTo },
    salespersonId: spId,
  }

  const agg = await BillingEntryModel.aggregate([
    { $match: billingFilter },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ])
  return Number(agg?.[0]?.total || 0)
}

export const getSalesDashboardCards = async ({ employeeId, branchId = null }) => {
  const empty = {
    monthlyFrom: null,
    monthlyTo: null,
    monthlyQueriesCount: 0,
    monthlyQuotationsCount: 0,
    monthlyPurchaseOrdersCount: 0,
    pendingQueriesCount: 0,
    pendingQuotationsCount: 0,
    pendingPurchaseOrdersCount: 0,
    pendingCollectionAmount: 0,
    weeklyTarget: 0,
    weeklyBilling: 0,
    monthlyTarget: 0,
    monthlyBilling: 0,
    weeklyPeriodFrom: null,
    weeklyPeriodTo: null,
    monthlyPeriodFrom: null,
    monthlyPeriodTo: null,
    pendingQueries: [],
    pendingQuotations: [],
    pendingPurchaseOrders: [],
    employeeId: '',
    branchIdFromToken: branchId != null ? String(branchId) : null,
  }
  if (!employeeId || !mongoose.Types.ObjectId.isValid(String(employeeId))) {
    return empty
  }

  const oid = new mongoose.Types.ObjectId(String(employeeId))
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

  const salesPoScope = {
    $or: [{ salesEmployeeId: oid }, { salesEmployeeId: null, created_by: oid }],
  }
  const monthCreatedFilter = { createdAt: { $gte: monthStart, $lte: monthEnd } }

  const pendingQueryFilter = {
    isDeleted: false,
    created_by: oid,
    status: 'drafted',
  }
  const pendingQuotationFilter = {
    isDeleted: false,
    created_by: oid,
    status: { $nin: [QUOTATION_STATUS.CLOSED, QUOTATION_STATUS.FULFILLED] },
  }
  const pendingPoFilter = {
    isDeleted: false,
    ...salesPoScope,
    status: { $nin: [PURCHASE_ORDER_STATUS.FULFILLED, PURCHASE_ORDER_STATUS.CANCELLED] },
  }

  const [
    monthlyQueriesCount,
    monthlyQuotationsCount,
    monthlyPurchaseOrdersCount,
    pendingQueriesCount,
    pendingQuotationsCount,
    pendingPurchaseOrdersCount,
    posForOutstanding,
    pendingQueriesRaw,
    pendingQuotationsRaw,
    pendingPurchaseOrdersRaw,
  ] = await Promise.all([
    QueryModel.countDocuments({
      isDeleted: false,
      created_by: oid,
      ...monthCreatedFilter,
    }),
    QuotationModel.countDocuments({
      isDeleted: false,
      created_by: oid,
      ...monthCreatedFilter,
    }),
    PurchaseOrderModel.countDocuments({
      isDeleted: false,
      ...salesPoScope,
      ...monthCreatedFilter,
    }),
    QueryModel.countDocuments(pendingQueryFilter),
    QuotationModel.countDocuments(pendingQuotationFilter),
    PurchaseOrderModel.countDocuments(pendingPoFilter),
    PurchaseOrderModel.find({
      isDeleted: false,
      ...salesPoScope,
      status: { $nin: [PURCHASE_ORDER_STATUS.CANCELLED, PURCHASE_ORDER_STATUS.FULFILLED] },
    })
      .select('products freightCharge packingCharge payments status')
      .lean(),
    QueryModel.find(pendingQueryFilter)
      .sort({ createdAt: -1 })
      .limit(25)
      .select('queryCode companyInfo status createdAt')
      .lean(),
    QuotationModel.find(pendingQuotationFilter)
      .sort({ createdAt: -1 })
      .limit(25)
      .select('quotationCode companyInfo status createdAt')
      .lean(),
    PurchaseOrderModel.find(pendingPoFilter)
      .sort({ createdAt: -1 })
      .limit(25)
      .select('poCode quotationId companyInfo status createdAt products freightCharge packingCharge payments')
      .lean(),
  ])

  let pendingCollectionAmount = 0
  for (const po of posForOutstanding) {
    pendingCollectionAmount += computePurchaseOrderFinancials(po).remainingAmount
  }

  const pendingQueries = pendingQueriesRaw.map((q) => ({
    id: String(q._id),
    queryCode: q.queryCode || '',
    companyName: q.companyInfo?.name || '—',
    status: q.status || '',
    createdAt: q.createdAt ? new Date(q.createdAt).toISOString() : null,
  }))

  const pendingQuotations = pendingQuotationsRaw.map((q) => ({
    id: String(q._id),
    quotationCode: q.quotationCode || '',
    companyName: q.companyInfo?.name || '—',
    status: q.status || '',
    createdAt: q.createdAt ? new Date(q.createdAt).toISOString() : null,
  }))

  const pendingPurchaseOrders = pendingPurchaseOrdersRaw.map((po) => ({
    id: String(po._id),
    poCode: po.poCode || '',
    quotationId: po.quotationId ? String(po.quotationId) : '',
    companyName: po.companyInfo?.name || '—',
    status: po.status || '',
    remainingAmount: computePurchaseOrderFinancials(po).remainingAmount,
    createdAt: po.createdAt ? new Date(po.createdAt).toISOString() : null,
  }))

  const { weeklyFrom, weeklyTo, monthlyFrom, monthlyTo } = getSalesTargetWeeklyMonthlyRanges()
  const [weeklyTarget, monthlyTarget, weeklyBilling, monthlyBilling] = await Promise.all([
    getEmployeeTargetAmountForPeriod({
      employeeId,
      branchId,
      period: 'weekly',
      rangeFrom: weeklyFrom,
      rangeTo: weeklyTo,
    }),
    getEmployeeTargetAmountForPeriod({
      employeeId,
      branchId,
      period: 'monthly',
      rangeFrom: monthlyFrom,
      rangeTo: monthlyTo,
    }),
    getEmployeeBillingForRange({ employeeId, rangeFrom: weeklyFrom, rangeTo: weeklyTo }),
    getEmployeeBillingForRange({ employeeId, rangeFrom: monthlyFrom, rangeTo: monthlyTo }),
  ])

  return {
    monthlyFrom: monthStart.toISOString(),
    monthlyTo: monthEnd.toISOString(),
    monthlyQueriesCount,
    monthlyQuotationsCount,
    monthlyPurchaseOrdersCount,
    pendingQueriesCount,
    pendingQuotationsCount,
    pendingPurchaseOrdersCount,
    pendingCollectionAmount,
    weeklyTarget,
    weeklyBilling,
    monthlyTarget,
    monthlyBilling,
    weeklyPeriodFrom: weeklyFrom.toISOString(),
    weeklyPeriodTo: weeklyTo.toISOString(),
    monthlyPeriodFrom: monthlyFrom.toISOString(),
    monthlyPeriodTo: monthlyTo.toISOString(),
    pendingQueries,
    pendingQuotations,
    pendingPurchaseOrders,
    employeeId: String(employeeId),
    branchIdFromToken: branchId != null ? String(branchId) : null,
  }
}

/** Latest billing rows for sales dashboard (company from industry ref on companyId). */
export const getRecentSalesBillings = async ({ employeeId, limit = 5 }) => {
  const take = Math.min(Math.max(Number(limit) || 5, 1), 20)
  if (!employeeId || !mongoose.Types.ObjectId.isValid(String(employeeId))) {
    return []
  }
  const filter = {
    isDeleted: false,
    salespersonId: new mongoose.Types.ObjectId(String(employeeId)),
  }

  const rows = await BillingEntryModel.find(filter)
    .sort({ entryDate: -1, createdAt: -1 })
    .limit(take)
    .populate('companyId', 'name')
    .lean()

  return rows.map((row) => {
    const d = row.entryDate || row.createdAt
    return {
      id: String(row._id),
      amount: Number(row.amount || 0),
      companyName: row.companyId?.name || '—',
      date: d ? new Date(d).toISOString() : null,
    }
  })
}
