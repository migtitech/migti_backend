import mongoose from 'mongoose'
import { QUOTATION_STATUS } from '../../models/quotation.model.js'
import { PURCHASE_ORDER_STATUS } from '../../models/purchaseOrder.model.js'
import {
  createQuery,
  countQueries,
  findQueriesPaginated,
  findQueryByIdWithDetails,
  findOneQuerySelectIdLean,
  findOneQueryLean,
  updateQueryById,
  softDeleteQueryById,
  updateQueryStatus,
  findQueryByIdPopulateIndustry,
  findQueryIdsLean,
  findQueriesForBranchAnalytics,
  findPendingQueriesForDashboard,
} from '../../repository/query.repository.js'
import {
  findQuotationsByQueryIds,
  countQuotations,
  findQuotationsSelectProductsLean,
  findQuotationsForBranchAnalytics,
  findPendingQuotationsForDashboard,
} from '../../repository/quotation.repository.js'
import {
  countPurchaseOrders,
  findOutstandingPurchaseOrders,
  findPendingPurchaseOrdersForDashboard,
} from '../../repository/purchaseOrder.repository.js'
import {
  countPoEntries,
  aggregatePoEntryAmount,
  findPoEntriesForBranchAnalytics,
} from '../../repository/poEntry.repository.js'
import {
  countBillingEntries,
  aggregateBillingEntryAmount,
  findBillingEntriesForBranchAnalytics,
  findRecentBillingEntriesBySalesperson,
} from '../../repository/billingEntry.repository.js'
import {
  countQueryActivities,
  findQueryActivitiesPaginated,
  createQueryActivity,
  findQueryActivityByIdPopulated,
} from '../../repository/queryActivity.repository.js'
import {
  findProcurementEmployeesByGroups,
  findZoneEmployeesByRole,
  findEmployeeByIdWithNameEmail,
  findEmployeeZoneIdsLean,
} from '../../repository/employee.repository.js'
import {
  findIndustryAreaById,
  findIndustriesSelectIdLean,
} from '../../repository/industry.repository.js'
import { findAdminByIdWithNameEmail } from '../../repository/admin.repository.js'
import { findSuperAdminByIdWithNameEmail } from '../../repository/superAdmin.repository.js'
import { signPathsInBatch } from '../document/document.service.js'
import CustomError from '../../utils/exception.js'
import { statusCodes, errorCodes } from '../../core/common/constant.js'
import {
  appendConvertedQuotationOnQuery,
  createQuotationFromQuery,
  getQuotationByQueryId,
} from '../quotation/quotation.service.js'
import { createDraftTasksForQueryProducts } from '../taskManagement/taskManagement.service.js'
import {
  getNextSequence,
  formatProductCodeValue,
  formatRitemsValue,
} from '../codeSequence/codeSequence.service.js'
import {
  findProductsByProductCodes,
  createProductFromQueryLine as createProductFromQueryLineRepo,
} from '../../repository/product.repository.js'
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
  getMyZoneTargets as getMyZoneTargetsData,
  closeExpiredZoneTargets as closeExpiredZoneTargetsData,
} from '../targetAnalytics/targetAnalytics.service.js'
import { computePurchaseOrderFinancials } from '../purchaseOrder/purchaseOrder.service.js'
import { findBranchEmployeeTargetOne } from '../../repository/branchEmployeeTarget.repository.js'
import { aggregateBranchZoneTargetAmount } from '../../repository/branchZoneTarget.repository.js'
import { findTargetAnalyticsForCurrentWindow } from '../../repository/targetAnalytics.repository.js'
import { assertSubZoneBelongsToArea } from '../subZone/subZone.service.js'
import { resolveQueryAccessFilter } from '../../core/helpers/queryAccess.js'
import {
  listQueryProductDocuments,
  replaceQueryProductDocuments,
  softDeleteQueryProductRowsForQuery,
} from '../queryProduct/queryProduct.service.js'
import {
  aggregateQueryProductRateAvailableCounts,
  deriveProBucketStatus,
  PRO_BUCKET_STATUS,
} from '../../repository/queryProduct.repository.js'
import {
  updateProductlHodRatesStatusByProCodes,
  findApprovedProductlHodRatesByProCode,
  PRODUCTL_HOD_RATE_STATUS,
} from '../../repository/productlHodRates.repository.js'
import { createNotifications } from '../notification/notification.service.js'

const OBJECT_ID_REGEX = /^[a-fA-F0-9]{24}$/
const PROCUREMENT_QUERY_ROLES = ['procurement']
const QUERY_ZONE_HOD_ROLES = ['head_of_department', 'hod']
const QUERY_ZONE_SALES_ROLES = ['sales_manager', 'sales_exicutive', 'sales']

/** Pro bucket / query_products line statuses that count as “rate available”. */
const QUERY_PRODUCT_RATE_STATUSES = ['rate_submitted', 'fulfilled']

const attachQueryProductRateAvailableCounts = async (queries = []) => {
  if (!queries?.length) return queries
  const queryIds = queries.map((q) => q._id).filter(Boolean)
  if (!queryIds.length) {
    return queries.map((q) => ({
      ...q,
      queryProductRateAvailableCount: 0,
    }))
  }

  let grouped = []
  try {
    grouped = await aggregateQueryProductRateAvailableCounts(
      queryIds,
      QUERY_PRODUCT_RATE_STATUSES
    )
  } catch (err) {
    console.error('query_products rate count aggregation failed', err)
    grouped = []
  }

  const byQueryId = new Map(
    grouped.map((g) => [String(g._id), g.count || 0])
  )

  return queries.map((q) => ({
    ...q,
    queryProductRateAvailableCount: q._id
      ? byQueryId.get(String(q._id)) || 0
      : 0,
  }))
}

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

const normalizeQueryProductIds = (p) => {
  const next = { ...p }
  if (next.groupId && mongoose.Types.ObjectId.isValid(String(next.groupId))) {
    next.groupId = new mongoose.Types.ObjectId(String(next.groupId))
  } else {
    next.groupId = null
  }
  if (
    next.categoryId &&
    mongoose.Types.ObjectId.isValid(String(next.categoryId))
  ) {
    next.categoryId = new mongoose.Types.ObjectId(String(next.categoryId))
  } else {
    next.categoryId = null
  }
  if (
    next.subcategoryId &&
    mongoose.Types.ObjectId.isValid(String(next.subcategoryId))
  ) {
    next.subcategoryId = new mongoose.Types.ObjectId(String(next.subcategoryId))
  } else {
    next.subcategoryId = null
  }
  return next
}

const toObjectIdOrNull = (value) => {
  if (!value) return null
  const id = typeof value === 'object' && value._id ? value._id : value
  return mongoose.Types.ObjectId.isValid(String(id))
    ? new mongoose.Types.ObjectId(String(id))
    : null
}

const collectQueryGroupIds = (products = []) => {
  const seen = new Set()
  const out = []
  for (const product of Array.isArray(products) ? products : []) {
    const oid = toObjectIdOrNull(product?.groupId)
    if (!oid) continue
    const key = String(oid)
    if (seen.has(key)) continue
    seen.add(key)
    out.push(oid)
  }
  return out
}

const resolveQueryZoneId = async (query = {}) => {
  const industryId = toObjectIdOrNull(query.industry_id)
  if (industryId) {
    const industry = await findIndustryAreaById(industryId)
    const zoneId = toObjectIdOrNull(industry?.area)
    if (zoneId) return zoneId
  }
  return toObjectIdOrNull(query?.companyInfo?.area)
}

const collectEmployeeIds = (employees = []) => {
  const out = []
  const seen = new Set()
  for (const employee of employees) {
    const id = employee?._id
    if (!id) continue
    const key = String(id)
    if (seen.has(key)) continue
    seen.add(key)
    out.push(key)
  }
  return out
}

const mergeUniqueIds = (...lists) => {
  const seen = new Set()
  const out = []
  for (const list of lists) {
    for (const id of list || []) {
      const key = String(id)
      if (!key || seen.has(key)) continue
      seen.add(key)
      out.push(key)
    }
  }
  return out
}

/**
 * Notify procurement employees assigned to query item groups and zone owners
 * (HOD + sales roles) for the client zone. Non-throwing by design so query
 * creation is never blocked by notification delivery.
 */
export const notifyEmployeesForCreatedQuery = async ({ query, io } = {}) => {
  if (!query?._id) return { created: [], count: 0 }

  try {
    const branchId = toObjectIdOrNull(query.branchId)
    const branchFilter = branchId ? { branchId } : {}
    const groupIds = collectQueryGroupIds(query.products)
    const zoneId = await resolveQueryZoneId(query)

    let procurementEmployeeIds = []
    let hodEmployeeIds = []
    let salesEmployeeIds = []

    if (groupIds.length) {
      const procurementEmployees = await findProcurementEmployeesByGroups({
        ...branchFilter,
        role: { $in: PROCUREMENT_QUERY_ROLES },
        assigned_groups: { $in: groupIds },
        isDeleted: false,
      })
      procurementEmployeeIds = collectEmployeeIds(procurementEmployees)
    }

    if (zoneId) {
      const zoneMatch = {
        $or: [{ zoneIds: zoneId }, { zoneId }],
      }

      const [hodZoneEmployees, salesZoneEmployees] = await Promise.all([
        findZoneEmployeesByRole({
          ...branchFilter,
          role: { $in: QUERY_ZONE_HOD_ROLES },
          ...zoneMatch,
          isDeleted: false,
        }),
        findZoneEmployeesByRole({
          ...branchFilter,
          role: { $in: QUERY_ZONE_SALES_ROLES },
          ...zoneMatch,
          isDeleted: false,
        }),
      ])
      hodEmployeeIds = collectEmployeeIds(hodZoneEmployees)
      salesEmployeeIds = collectEmployeeIds(salesZoneEmployees)
    }

    const recipientIds = mergeUniqueIds(
      procurementEmployeeIds,
      hodEmployeeIds,
      salesEmployeeIds
    )

    if (!recipientIds.length) return { created: [], count: 0 }

    const queryCode =
      query.queryCode ||
      query.query_tracking_code ||
      String(query._id || '').slice(-8)
    const companyName = String(query?.companyInfo?.name || '').trim()
    const description = companyName
      ? `Query ${queryCode} was created for ${companyName}.`
      : `Query ${queryCode} was created.`

    return createNotifications({
      title: 'New query created',
      description,
      employeeIds: recipientIds,
      io,
      metadata: {
        eventType: 'query_created',
        queryId: String(query._id),
        queryCode: String(queryCode || ''),
        branchId: branchId ? String(branchId) : '',
        zoneId: zoneId ? String(zoneId) : '',
        groupIds: groupIds.map(String),
        recipientEmployeeIds: recipientIds,
        procurementEmployeeIds,
        hodEmployeeIds,
        salesEmployeeIds,
      },
    })
  } catch (err) {
    console.error('Failed to notify employees for created query', err)
    return { created: [], count: 0 }
  }
}

/**
 * Creates a new product entry in the products catalog from a query line item.
 * The product is the source of truth — its `productCode` and `_id` are used as
 * `rawProductCode` and `product_id` on the query line.
 * `category` validation is skipped via `validateBeforeSave: false` since it may
 * not always be present on the query line.
 */
const createProductFromQueryLine = async (p, productCode) =>
  createProductFromQueryLineRepo({
    name: String(p.productName || '').trim() || productCode,
    sku: productCode,
    productCode,
    hsnNumber: (p.hsnNumber && String(p.hsnNumber).trim()) || '',
    gstPercentage: typeof p.gstPercentage === 'number' ? p.gstPercentage : 0,
    unit: (p.unit && String(p.unit).trim()) || 'PCS',
    group: toObjectIdOrNull(p.groupId),
    category: toObjectIdOrNull(p.categoryId),
    subcategory: toObjectIdOrNull(p.subcategoryId),
  })

/**
 * Ensures every query product line has a valid `rawProductCode` and `product_id`,
 * treating the **products table as the single source of truth**.
 *
 * Two paths:
 *
 * 1. `rawProductCode` is non-empty (frontend sent it from the catalog):
 *    - Verify the code exists in the products table.
 *    - If found  → set `product_id` from that record, keep `rawProductCode`. No new product created.
 *    - If not found → keep `rawProductCode` as-is (edge case; no product created).
 *
 * 2. `rawProductCode` is null / empty (new product not yet in the catalog):
 *    - Allocate the next `productCode` from the shared sequence.
 *    - Create a new `hod_approval_pending` product entry in the products table.
 *    - Back-fill `rawProductCode` and `product_id` from the newly created product.
 */
const enrichQueryProductsWithRawCodes = async (products) => {
  if (!Array.isArray(products)) return []

  const incomingCodes = [
    ...new Set(
      products
        .map((p) =>
          p?.rawProductCode != null ? String(p.rawProductCode).trim() : ''
        )
        .filter(Boolean)
    ),
  ]

  const existingByCode = new Map()
  if (incomingCodes.length) {
    const existingProducts = await findProductsByProductCodes(incomingCodes)
    for (const prod of existingProducts) {
      existingByCode.set(String(prod.productCode).trim(), prod)
    }
  }

  const out = []
  for (const p of products) {
    let next = { ...p }
    const incomingCode =
      next.rawProductCode != null ? String(next.rawProductCode).trim() : ''

    if (incomingCode) {
      const prod = existingByCode.get(incomingCode)
      if (prod) {
        next.rawProductCode = String(prod.productCode).trim()
        next.product_id = prod._id
      }
    } else {
      try {
        const n = await getNextSequence('productCode')
        const productCode = formatProductCodeValue(n)
        const newProduct = await createProductFromQueryLine(next, productCode)
        next.rawProductCode = String(newProduct.productCode).trim()
        next.product_id = newProduct._id
      } catch (err) {
        console.error('Failed to auto-create product from query line', err)
      }
    }

    out.push(normalizeQueryProductIds(next))
  }
  return out
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
  const rows = await findQuotationsByQueryIds(ids)
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
    const stored = Array.isArray(q.convertedQuotations)
      ? q.convertedQuotations
      : []
    const merged = dedupeConvertedQuotationRefs([...stored, ...fromDb])
    return { ...q, convertedQuotations: merged }
  })
}

const syncProductlHodRatesOnQueryCreate = async (products = []) => {
  const proCodes = [
    ...new Set(
      (products || [])
        .map((p) => String(p?.rawProductCode || '').trim())
        .filter(Boolean)
    ),
  ]
  if (!proCodes.length) return

  await updateProductlHodRatesStatusByProCodes(
    proCodes,
    PRODUCTL_HOD_RATE_STATUS.HOD_APPROVAL_PENDING
  )
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
  const ritemsNum = await getNextSequence('ritems')
  const query_tracking_code = formatRitemsValue(ritemsNum)

  const mapped = mapProductsWithImages(products || [])
  const normalizedProducts = await enrichQueryProductsWithRawCodes(mapped)

  await validateCompanyInfoSubZone(companyInfo, branchId)

  const doc = await createQuery({
    queryCode,
    query_tracking_code,
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

  try {
    await replaceQueryProductDocuments({
      queryId: doc._id,
      queryCode: doc.queryCode,
      products: queryObj.products || [],
      skipRatesCarryOver: true,
    })
  } catch (err) {
    console.error('Failed to sync query_products for query', err)
  }

  try {
    await syncProductlHodRatesOnQueryCreate(queryObj.products || [])
  } catch (err) {
    console.error('Failed to sync productl_hod_rates for query', err)
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
  areaIds = '',
  zoneIds = '',
  industryId = '',
  branchFilter = {},
  currentUserId = null,
  isFullAccessRole = true,
  role = '',
}) => {
  const page = Math.max(1, parseInt(pageNumber))
  const limit = Math.min(100, Math.max(1, parseInt(pageSize)))
  const skip = (page - 1) * limit

  const ownershipFilter = await resolveQueryAccessFilter({
    currentUserId,
    isFullAccessRole,
    role,
    branchFilter,
  })
  const filter = { isDeleted: false, ...branchFilter, ...ownershipFilter }
  if (
    industryId &&
    String(industryId).trim() &&
    mongoose.Types.ObjectId.isValid(industryId)
  ) {
    filter.industry_id = new mongoose.Types.ObjectId(String(industryId).trim())
  }
  if (status && status.trim()) {
    filter.status = status.trim()
  }
  if (areaIds && String(areaIds).trim()) {
    const selectedAreaIds = String(areaIds)
      .split(',')
      .map((v) => String(v || '').trim())
      .filter(Boolean)
    if (selectedAreaIds.length) {
      const areaObjectIds = selectedAreaIds
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id))
      filter['companyInfo.area'] = {
        $in: [...selectedAreaIds, ...areaObjectIds],
      }
    }
  }
  if (zoneIds && String(zoneIds).trim()) {
    const selectedZoneIds = String(zoneIds)
      .split(',')
      .map((v) => String(v || '').trim())
      .filter(Boolean)
    if (selectedZoneIds.length) {
      const zoneObjectIds = selectedZoneIds
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id))
      filter['companyInfo.area'] = {
        $in: [...selectedZoneIds, ...zoneObjectIds],
      }
    }
  }

  let fromD =
    dateFrom && String(dateFrom).trim() ? startOfUtcDay(dateFrom) : null
  let toD = dateTo && String(dateTo).trim() ? endOfUtcDay(dateTo) : null
  if (fromD && toD && fromD > toD) {
    throw new CustomError(
      statusCodes.badRequest,
      'dateFrom must be on or before dateTo',
      errorCodes.bad_request
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

  const totalItemsPromise = countQueries(filter)
  const queriesPromise = findQueriesPaginated(filter, skip, limit)

  const [totalItems, queries] = await Promise.all([
    totalItemsPromise,
    queriesPromise,
  ])

  const [queriesWithRefs, queriesWithRateCounts] = await Promise.all([
    mergeQuotationRefsForQueries(queries),
    attachQueryProductRateAvailableCounts(queries),
  ])

  const rateCountById = new Map(
    queriesWithRateCounts.map((q) => [String(q._id), q.queryProductRateAvailableCount])
  )
  const queriesWithRefsAndCounts = queriesWithRefs.map((q) => ({
    ...q,
    queryProductRateAvailableCount: rateCountById.get(String(q._id)) || 0,
  }))

  const totalPages = Math.ceil(totalItems / limit)

  return {
    queries: queriesWithRefsAndCounts,
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
  skipMergeQuotationRefs = false,
  skipSignedUrls = false,
  forPdf = false,
}) => {
  const ownershipFilter = await resolveQueryAccessFilter({
    currentUserId,
    isFullAccessRole,
    role,
    branchFilter,
  })
  const query = await findQueryByIdWithDetails(
    {
      _id: queryId,
      isDeleted: false,
      ...branchFilter,
      ...ownershipFilter,
    },
    { forPdf }
  )

  if (!query) {
    throw new CustomError(
      statusCodes.notFound,
      'Query not found',
      errorCodes.not_found
    )
  }

  if (!skipSignedUrls && query.products?.length) {
    const paths = []
    for (const p of query.products) {
      if (p.product_id && typeof p.product_id === 'object') {
        if (Array.isArray(p.product_id.images)) {
          paths.push(...p.product_id.images.map((doc) => doc?.path))
        }
      }
      if (Array.isArray(p.images)) {
        paths.push(...p.images.map((doc) => doc?.path))
      }
    }
    const signedByPath = await signPathsInBatch(paths)
    const applySignedDoc = (doc) => {
      if (!doc?.path) return doc
      const displayPath = signedByPath.get(doc.path) || doc.path
      return { ...doc, path: displayPath }
    }

    for (const p of query.products) {
      if (p.product_id && typeof p.product_id === 'object') {
        if (Array.isArray(p.product_id.images)) {
          p.product_id.images = p.product_id.images.map(applySignedDoc)
        }
      }
      if (Array.isArray(p.images) && p.images.length) {
        p.images = p.images.map(applySignedDoc)
      }
    }
  }

  if (skipMergeQuotationRefs) return query

  const [withRefs] = await mergeQuotationRefsForQueries([query])
  return withRefs
}

const matchQueryProductRowByCode = (rows, rawProductCode, lineIndex) => {
  const code = String(rawProductCode ?? '').trim()
  if (code) {
    const same = rows.filter(
      (r) => String(r.rawProductCode || '').trim() === code
    )
    if (same.length === 1) return same[0]
    if (lineIndex != null && lineIndex !== '') {
      const li = Number(lineIndex)
      if (Number.isFinite(li) && li >= 0) {
        const withIdx = same.find((r) => r.lineIndex === li)
        if (withIdx) return withIdx
      }
    }
    return same[0] || null
  }
  if (lineIndex != null && lineIndex !== '') {
    const li = Number(lineIndex)
    if (Number.isFinite(li) && li >= 0) {
      return rows.find((r) => r.lineIndex === li) || null
    }
  }
  return null
}

const resolveQueryProductLineStatus = (doc) => {
  if (!doc) return null
  const ratesLen = Array.isArray(doc.rates) ? doc.rates.length : 0
  return (
    doc.status ||
    deriveProBucketStatus(ratesLen) ||
    PRO_BUCKET_STATUS.PENDING
  )
}

/**
 * HOD procurement rates for one query line, from `productl_hod_rates`.
 * Respects the same branch + ownership rules as {@link getQueryById}.
 */
export const getQueryLineProcurementRates = async ({
  queryId,
  rawProductCode,
  lineIndex,
  branchFilter = {},
  currentUserId = null,
  isFullAccessRole = true,
  role = '',
}) => {
  if (!queryId || !mongoose.Types.ObjectId.isValid(String(queryId))) {
    throw new CustomError(
      statusCodes.badRequest,
      'Invalid query id',
      errorCodes.bad_request
    )
  }
  const code = String(rawProductCode ?? '').trim()
  if (!code) {
    throw new CustomError(
      statusCodes.badRequest,
      'rawProductCode is required',
      errorCodes.bad_request
    )
  }

  const ownershipFilter = await resolveQueryAccessFilter({
    currentUserId,
    isFullAccessRole,
    role,
    branchFilter,
  })
  const queryOk = await findOneQuerySelectIdLean({
    _id: queryId,
    isDeleted: false,
    ...branchFilter,
    ...ownershipFilter,
  })
  if (!queryOk) {
    throw new CustomError(
      statusCodes.notFound,
      'Query not found',
      errorCodes.not_found
    )
  }

  const qid = new mongoose.Types.ObjectId(String(queryId))
  const rows = await listQueryProductDocuments(qid)
  const doc = matchQueryProductRowByCode(rows, code, lineIndex)

  const hodRows = await findApprovedProductlHodRatesByProCode(code)

  return {
    rawProductCode: code,
    lineIndex: doc?.lineIndex ?? null,
    productName: doc?.productName || '',
    status: resolveQueryProductLineStatus(doc),
    rates: hodRows.map((r) => ({
      _id: r?._id != null ? String(r._id) : undefined,
      minRate:
        typeof r?.min_rate === 'number' && !Number.isNaN(r.min_rate)
          ? r.min_rate
          : null,
      maxRate:
        typeof r?.max_rate === 'number' && !Number.isNaN(r.max_rate)
          ? r.max_rate
          : null,
      discount:
        typeof r?.discount === 'number' && !Number.isNaN(r.discount)
          ? r.discount
          : 0,
      unit: String(r?.unit || ''),
    })),
  }
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

export const listQueryActivities = async ({
  queryId,
  pageNumber = 1,
  pageSize = 10,
  branchFilter = {},
  currentUserId = null,
  isFullAccessRole = true,
  role = '',
}) => {
  const ownershipFilter = await resolveQueryAccessFilter({
    currentUserId,
    isFullAccessRole,
    role,
    branchFilter,
  })
  const queryBelongs = await findOneQueryLean({
    _id: queryId,
    isDeleted: false,
    ...branchFilter,
    ...ownershipFilter,
  })
  if (!queryBelongs) {
    throw new CustomError(
      statusCodes.notFound,
      'Query not found',
      errorCodes.not_found
    )
  }

  const page = Math.max(1, parseInt(pageNumber))
  const limit = Math.min(100, Math.max(1, parseInt(pageSize)))
  const skip = (page - 1) * limit

  const filter = { queryId }
  const totalItems = await countQueryActivities(filter)
  const activities = await findQueryActivitiesPaginated(filter, skip, limit)

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
  const ownershipFilter = await resolveQueryAccessFilter({
    currentUserId,
    isFullAccessRole,
    role,
    branchFilter,
  })
  const query = await findOneQueryLean({
    _id: queryId,
    isDeleted: false,
    ...branchFilter,
    ...ownershipFilter,
  })
  if (!query) {
    throw new CustomError(
      statusCodes.notFound,
      'Query not found',
      errorCodes.not_found
    )
  }

  const activity = await createQueryActivity({
    queryId,
    type,
    performedBy,
    meta: {
      action: meta.action || '',
      followUpStatus: meta.followUpStatus || '',
      note: meta.note || '',
    },
  })

  const populated = await findQueryActivityByIdPopulated(activity._id)
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
  const ownershipFilter = await resolveQueryAccessFilter({
    currentUserId,
    isFullAccessRole,
    role,
    branchFilter,
  })
  const existing = await findOneQueryLean({
    _id: queryId,
    isDeleted: false,
    ...branchFilter,
    ...ownershipFilter,
  })
  if (!existing) {
    throw new CustomError(
      statusCodes.notFound,
      'Query not found',
      errorCodes.not_found
    )
  }

  if (existing.status === 'closed') {
    throw new CustomError(
      statusCodes.badRequest,
      'This query is closed and cannot be updated',
      errorCodes.bad_request
    )
  }

  const updatePayload = {}
  if (companyInfo !== undefined) {
    const mergedCi = { ...(existing.companyInfo || {}), ...companyInfo }
    await validateCompanyInfoSubZone(mergedCi, existing.branchId)
    updatePayload.companyInfo = companyInfo
  }
  if (industry_id !== undefined) updatePayload.industry_id = industry_id || null
  if (products !== undefined) {
    const mapped = mapProductsWithImages(products)
    updatePayload.products = await enrichQueryProductsWithRawCodes(mapped)
  }
  if (delivery !== undefined) updatePayload.delivery = delivery
  if (status !== undefined) updatePayload.status = status
  if (close_remark !== undefined) updatePayload.close_remark = close_remark

  const updated = await updateQueryById(queryId, updatePayload)

  if (updated && products !== undefined) {
    try {
      await replaceQueryProductDocuments({
        queryId: updated._id,
        queryCode: updated.queryCode,
        products: updated.products || [],
      })
    } catch (err) {
      console.error('Failed to sync query_products for query update', err)
    }
  }

  return updated
}

export const deleteQuery = async ({
  queryId,
  branchFilter = {},
  currentUserId = null,
  isFullAccessRole = true,
  role = '',
}) => {
  const ownershipFilter = await resolveQueryAccessFilter({
    currentUserId,
    isFullAccessRole,
    role,
    branchFilter,
  })
  const existing = await findOneQueryLean({
    _id: queryId,
    isDeleted: false,
    ...branchFilter,
    ...ownershipFilter,
  })
  if (!existing) {
    throw new CustomError(
      statusCodes.notFound,
      'Query not found',
      errorCodes.not_found
    )
  }

  await softDeleteQueryById(queryId)

  try {
    await softDeleteQueryProductRowsForQuery(queryId)
  } catch (err) {
    console.error('Failed to soft-delete query_product rows for query', err)
  }

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
  const ownershipFilter = await resolveQueryAccessFilter({
    currentUserId,
    isFullAccessRole,
    role,
    branchFilter,
  })
  const existing = await findOneQueryLean({
    _id: queryId,
    isDeleted: false,
    ...branchFilter,
    ...ownershipFilter,
  })
  if (!existing) {
    throw new CustomError(
      statusCodes.notFound,
      'Query not found',
      errorCodes.not_found
    )
  }

  await appendConvertedQuotationOnQuery(queryId, quotationId, quotationCode)

  return {
    queryId: String(queryId),
    quotationId: String(quotationId),
    quotationCode: String(quotationCode || '').trim(),
    branchId: existing.branchId || null,
    queryCode: existing.queryCode || '',
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
  const existing = await findOneQueryLean({
    queryCode,
    isDeleted: false,
    ...branchFilter,
    ...ownershipFilter,
  })
  if (!existing) {
    throw new CustomError(
      statusCodes.notFound,
      'Query not found',
      errorCodes.not_found
    )
  }

  if (existing.status === 'closed') {
    throw new CustomError(
      statusCodes.badRequest,
      'Cannot convert a closed query to quotation',
      errorCodes.bad_request
    )
  }

  let quotation = null
  if (!forceNewQuotation) {
    quotation = await getQuotationByQueryId({
      queryId: existing._id,
      branchFilter,
    })
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
    quotation.quotationCode
  )

  if (existing.status !== 'convertedToQuotation') {
    await updateQueryStatus(existing._id, 'convertedToQuotation')
  }

  const updatedQuery = await findQueryByIdPopulateIndustry(existing._id)

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

export const getTodayDashboardStats = async ({
  branchFilter = {},
  currentUserId = null,
  isFullAccessRole = true,
  role = '',
}) => {
  const { start, end } = getDayRange()
  const ownershipFilter = await resolveQueryAccessFilter({
    currentUserId,
    isFullAccessRole,
    role,
    branchFilter,
  })

  const queryFilter = {
    isDeleted: false,
    ...branchFilter,
    ...ownershipFilter,
    createdAt: { $gte: start, $lt: end },
  }

  const todayQueryCount = await countQueries(queryFilter)

  let quotationFilter = {
    isDeleted: false,
    ...branchFilter,
    createdAt: { $gte: start, $lt: end },
  }

  if (currentUserId && !isFullAccessRole) {
    const ownQueryIds = await findQueryIdsLean({
      isDeleted: false,
      ...branchFilter,
      ...ownershipFilter,
    })

    const ids = ownQueryIds.map((q) => q._id)
    quotationFilter = {
      ...quotationFilter,
      queryId: { $in: ids },
    }
  }

  const todayQuotationCount = await countQuotations(quotationFilter)
  const todayQuotations = await findQuotationsSelectProductsLean(quotationFilter)

  const todayQuotedAmount = todayQuotations.reduce(
    (sum, q) => sum + computeQuotationAmount(q?.products || []),
    0
  )

  return {
    todayQueryCount,
    todayQuotationCount,
    todayQuotedAmount,
  }
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
  const ownershipFilter = await resolveQueryAccessFilter({
    currentUserId,
    isFullAccessRole,
    role,
    branchFilter,
  })

  const queryBaseFilter = {
    isDeleted: false,
    ...ownershipFilter,
    ...branchFilter,
  }
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
    const ownQueryIds = await findQueryIdsLean({
      isDeleted: false,
      ...branchFilter,
      ...ownershipFilter,
    })
    quotationBaseFilter.queryId = { $in: ownQueryIds.map((q) => q._id) }
  }

  const [
    totalQueries,
    totalQuotation,
    totalPo,
    totalBilling,
    poAmountAgg,
    billingAmountAgg,
  ] = await Promise.all([
    countQueries(queryBaseFilter),
    countQuotations(quotationBaseFilter),
    countPoEntries(poBaseFilter),
    countBillingEntries(billingBaseFilter),
    aggregatePoEntryAmount(poBaseFilter),
    aggregateBillingEntryAmount(billingBaseFilter),
  ])

  const quotedAmountDocs = await findQuotationsSelectProductsLean(
    quotationBaseFilter
  )
  const quotedAmount = quotedAmountDocs.reduce(
    (sum, q) => sum + computeQuotationAmount(q?.products || []),
    0
  )
  const poAmount = poAmountAgg?.[0]?.total || 0
  const billingAmount = billingAmountAgg?.[0]?.total || 0

  let rows = []
  let totalItems = 0
  if (tab === 'queries') {
    totalItems = totalQueries
    rows = await findQueriesForBranchAnalytics(queryBaseFilter, skip, limit)
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
    rows = await findQuotationsForBranchAnalytics(
      quotationBaseFilter,
      skip,
      limit
    )
    rows = rows.map((item) => ({
      _id: item._id,
      quotationCode: item.quotationCode || '',
      status: item.status || '',
      companyInfo: item.companyInfo || {},
      branchId: asObjectIdString(item.branchId),
      totalAmount:
        typeof item.totalAmount === 'number'
          ? item.totalAmount
          : computeQuotationAmount(item?.products || []),
      createdAt: item.createdAt,
    }))
  } else if (tab === 'po') {
    totalItems = totalPo
    rows = await findPoEntriesForBranchAnalytics(poBaseFilter, skip, limit)
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
    rows = await findBillingEntriesForBranchAnalytics(
      billingBaseFilter,
      skip,
      limit
    )
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

export const getZoneTargetAnalytics = async (params = {}) =>
  getZoneTargetAnalyticsData(params)
export const upsertZoneTargetAnalytics = async (params = {}) =>
  upsertZoneTargetAnalyticsData(params)
export const getZoneTargetSummary = async (params = {}) =>
  getZoneTargetSummaryData(params)
export const getEmployeeTargetAnalytics = async (params = {}) =>
  getEmployeeTargetAnalyticsData(params)
export const upsertEmployeeTargetAnalytics = async (params = {}) =>
  upsertEmployeeTargetAnalyticsData(params)
export const getEmployeeTargetSummary = async (params = {}) =>
  getEmployeeTargetSummaryData(params)
export const getMyZoneTargets = async (params = {}) =>
  getMyZoneTargetsData(params)
export const closeExpiredZoneTargets = async () => closeExpiredZoneTargetsData()

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

const getBranchTargetDocForCurrentWindow = async (
  branchId,
  period,
  start,
  end
) => {
  return findTargetAnalyticsForCurrentWindow({
    isDeleted: false,
    branchId,
    period,
    dateFrom: { $lte: end },
    dateTo: { $gte: start },
  })
}

/** Billing total for branch: strict branchId on billingentries, entryDate in range. */
const getBranchBillingTotalByEntryDate = async (
  branchId,
  rangeFrom,
  rangeTo
) => {
  if (!branchId || !mongoose.Types.ObjectId.isValid(String(branchId))) return 0
  const bid = new mongoose.Types.ObjectId(String(branchId))
  const match = {
    isDeleted: false,
    branchId: bid,
    entryDate: { $gte: rangeFrom, $lte: rangeTo },
  }
  const agg = await aggregateBillingEntryAmount(match)
  return Number(agg?.[0]?.total || 0)
}

const resolveHodPeriod = async (branchId, period) => {
  const { start, end } = getBranchTargetCalendarRange(period)
  const targetDoc = await getBranchTargetDocForCurrentWindow(
    branchId,
    period,
    start,
    end
  )
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
    getBranchBillingTotalByEntryDate(
      branchId,
      weekly.rangeFrom,
      weekly.rangeTo
    ),
    getBranchBillingTotalByEntryDate(
      branchId,
      monthly.rangeFrom,
      monthly.rangeTo
    ),
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

  const monthlyFrom = new Date(
    today.getFullYear(),
    today.getMonth(),
    1,
    0,
    0,
    0,
    0
  )
  const lastDay = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0
  ).getDate()
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

const getEmployeeAreaScope = async ({ employeeId, branchId = null }) => {
  if (!employeeId || !mongoose.Types.ObjectId.isValid(String(employeeId))) {
    return { areaObjectIds: [], areaScopeValues: [], industryObjectIds: [] }
  }

  const employee = await findEmployeeZoneIdsLean({
    _id: new mongoose.Types.ObjectId(String(employeeId)),
    isDeleted: false,
  })

  const rawAreaIds = [
    ...(Array.isArray(employee?.zoneIds) ? employee.zoneIds : []),
    employee?.zoneId || null,
  ].filter(Boolean)

  const dedupedAreaIds = [
    ...new Set(rawAreaIds.map((id) => String(id).trim()).filter(Boolean)),
  ]
  const areaObjectIds = dedupedAreaIds
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id))

  if (!areaObjectIds.length) {
    return { areaObjectIds: [], areaScopeValues: [], industryObjectIds: [] }
  }

  const areaScopeValues = [...dedupedAreaIds, ...areaObjectIds]
  const industryFilter = { isDeleted: false, area: { $in: areaObjectIds } }
  if (branchId && mongoose.Types.ObjectId.isValid(String(branchId))) {
    industryFilter.branchId = new mongoose.Types.ObjectId(String(branchId))
  }
  const industries = await findIndustriesSelectIdLean(industryFilter)
  const industryObjectIds = industries.map((row) => row._id).filter(Boolean)

  return { areaObjectIds, areaScopeValues, industryObjectIds }
}

const getZoneTargetAmountForPeriod = async ({
  areaObjectIds = [],
  branchId = null,
  period,
  rangeFrom,
  rangeTo,
}) => {
  if (!Array.isArray(areaObjectIds) || !areaObjectIds.length) return 0
  const match = {
    isDeleted: false,
    zoneId: { $in: areaObjectIds },
    period,
    dateFrom: { $lte: rangeTo },
    dateTo: { $gte: rangeFrom },
  }
  if (branchId && mongoose.Types.ObjectId.isValid(String(branchId))) {
    match.branchId = new mongoose.Types.ObjectId(String(branchId))
  }
  const agg = await aggregateBranchZoneTargetAmount(match)
  return Number(agg?.[0]?.total || 0)
}

const getScopedBillingForRange = async ({
  industryObjectIds = [],
  branchId = null,
  rangeFrom,
  rangeTo,
}) => {
  if (!Array.isArray(industryObjectIds) || !industryObjectIds.length) return 0
  const match = {
    isDeleted: false,
    companyId: { $in: industryObjectIds },
    entryDate: { $gte: rangeFrom, $lte: rangeTo },
  }
  if (branchId && mongoose.Types.ObjectId.isValid(String(branchId))) {
    match.branchId = new mongoose.Types.ObjectId(String(branchId))
  }
  const agg = await aggregateBillingEntryAmount(match)
  return Number(agg?.[0]?.total || 0)
}

const getEmployeeTargetAmountForPeriod = async ({
  employeeId,
  branchId = null,
  period,
  rangeFrom,
  rangeTo,
}) => {
  const employeeObjectId = mongoose.Types.ObjectId.isValid(String(employeeId))
    ? new mongoose.Types.ObjectId(String(employeeId))
    : null
  if (!employeeObjectId) return 0

  const baseFilter = {
    isDeleted: false,
    employeeId: employeeObjectId,
    period,
    dateFrom: { $lte: rangeTo },
    dateTo: { $gte: rangeFrom },
  }

  const branchObjectId =
    branchId && mongoose.Types.ObjectId.isValid(String(branchId))
      ? new mongoose.Types.ObjectId(String(branchId))
      : null

  // Prefer branch-scoped target when available; fall back to employee-period target.
  const targetDoc = await findBranchEmployeeTargetOne(
    branchObjectId ? { ...baseFilter, branchId: branchObjectId } : baseFilter
  )

  if (targetDoc) return Number(targetDoc.targetAmount || 0)

  const fallbackDoc = await findBranchEmployeeTargetOne(baseFilter)
  return Number(fallbackDoc?.targetAmount || 0)
}

const getEmployeeBillingForRange = async ({
  employeeId,
  rangeFrom,
  rangeTo,
}) => {
  if (!employeeId || !mongoose.Types.ObjectId.isValid(String(employeeId))) {
    return 0
  }
  const employeeObjectId = new mongoose.Types.ObjectId(String(employeeId))
  const billingFilter = {
    isDeleted: false,
    entryDate: { $gte: rangeFrom, $lte: rangeTo },
    $or: [
      { salespersonId: employeeObjectId },
      { created_by: employeeObjectId },
    ],
  }

  const agg = await aggregateBillingEntryAmount(billingFilter)
  return Number(agg?.[0]?.total || 0)
}

export const getSalesDashboardCards = async ({
  employeeId,
  branchId = null,
}) => {
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

  const branchObjectId =
    branchId && mongoose.Types.ObjectId.isValid(String(branchId))
      ? new mongoose.Types.ObjectId(String(branchId))
      : null
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
  const monthEnd = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
    999
  )
  const { areaObjectIds, areaScopeValues, industryObjectIds } =
    await getEmployeeAreaScope({
      employeeId,
      branchId,
    })

  const scopedOr = []
  if (areaScopeValues.length)
    scopedOr.push({ 'companyInfo.area': { $in: areaScopeValues } })
  if (industryObjectIds.length)
    scopedOr.push({ industry_id: { $in: industryObjectIds } })
  const salesScopeFilter = scopedOr.length ? { $or: scopedOr } : { _id: null }
  const monthCreatedFilter = { createdAt: { $gte: monthStart, $lte: monthEnd } }
  const branchScopedFilter = branchObjectId ? { branchId: branchObjectId } : {}

  const pendingQueryFilter = {
    isDeleted: false,
    ...branchScopedFilter,
    ...salesScopeFilter,
    status: 'drafted',
  }
  const pendingQuotationFilter = {
    isDeleted: false,
    ...branchScopedFilter,
    ...salesScopeFilter,
    status: { $ne: QUOTATION_STATUS.HOD_APPROVED },
  }
  const pendingPoFilter = {
    isDeleted: false,
    ...branchScopedFilter,
    ...salesScopeFilter,
    status: {
      $nin: [PURCHASE_ORDER_STATUS.FULFILLED, PURCHASE_ORDER_STATUS.CANCELLED],
    },
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
    countQueries({
      isDeleted: false,
      ...branchScopedFilter,
      ...salesScopeFilter,
      ...monthCreatedFilter,
    }),
    countQuotations({
      isDeleted: false,
      ...branchScopedFilter,
      ...salesScopeFilter,
      ...monthCreatedFilter,
    }),
    countPurchaseOrders({
      isDeleted: false,
      ...branchScopedFilter,
      ...salesScopeFilter,
      ...monthCreatedFilter,
    }),
    countQueries(pendingQueryFilter),
    countQuotations(pendingQuotationFilter),
    countPurchaseOrders(pendingPoFilter),
    findOutstandingPurchaseOrders({
      isDeleted: false,
      ...branchScopedFilter,
      ...salesScopeFilter,
      status: {
        $nin: [
          PURCHASE_ORDER_STATUS.CANCELLED,
          PURCHASE_ORDER_STATUS.FULFILLED,
        ],
      },
    }),
    findPendingQueriesForDashboard(pendingQueryFilter),
    findPendingQuotationsForDashboard(pendingQuotationFilter),
    findPendingPurchaseOrdersForDashboard(pendingPoFilter),
  ])

  let pendingCollectionAmount = 0
  for (const po of posForOutstanding) {
    pendingCollectionAmount +=
      computePurchaseOrderFinancials(po).remainingAmount
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

  const { weeklyFrom, weeklyTo, monthlyFrom, monthlyTo } =
    getSalesTargetWeeklyMonthlyRanges()
  const [weeklyTarget, monthlyTarget, weeklyBilling, monthlyBilling] =
    await Promise.all([
      getZoneTargetAmountForPeriod({
        areaObjectIds,
        branchId,
        period: 'weekly',
        rangeFrom: weeklyFrom,
        rangeTo: weeklyTo,
      }),
      getZoneTargetAmountForPeriod({
        areaObjectIds,
        branchId,
        period: 'monthly',
        rangeFrom: monthlyFrom,
        rangeTo: monthlyTo,
      }),
      getScopedBillingForRange({
        industryObjectIds,
        branchId,
        rangeFrom: weeklyFrom,
        rangeTo: weeklyTo,
      }),
      getScopedBillingForRange({
        industryObjectIds,
        branchId,
        rangeFrom: monthlyFrom,
        rangeTo: monthlyTo,
      }),
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

  const rows = await findRecentBillingEntriesBySalesperson(filter, take)

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
