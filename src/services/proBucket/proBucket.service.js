import mongoose from 'mongoose'
import {
  findQueryByIdSelectQueryCode,
  findQueryByIdSelectBranchId,
} from '../../repository/query.repository.js'
import {
  findQueryProductsForProBucketList,
  countQueryProducts,
  findQueryProductByIdSelectId,
  findQueryProductByIdWithProBucketPopulates,
  findQueryProductByIdSelectRawProductCode,
  findByIdAndUpdateQueryProductQueryCode,
  findByIdAndUpdateQueryProductHodApproved,
  findByIdAndUpdateQueryProductRates,
  findOneAndUpdateQueryProduct,
  deriveProBucketStatus,
} from '../../repository/queryProduct.repository.js'
import queryProductRepository from '../../repository/queryProduct.repository.js'
import {
  findProductlHodRatesByProCode,
  updateManyPendingProductlHodRates,
  updateManyApprovedProductlHodRates,
  createProductlHodRate,
  insertManyProductlHodRates,
  PRODUCTL_HOD_RATE_STATUS,
} from '../../repository/productlHodRates.repository.js'
import {
  createProductHodRateHistory,
  countProductHodRateHistories,
  findProductHodRateHistories,
} from '../../repository/productHodRateHistory.repository.js'
import { findSupplierByIdSelectFields } from '../../repository/supplier.repository.js'
import { transformPathsToSignedUrls } from '../document/document.service.js'
import {
  createNotifications,
  getEmployeeIdsByRoles,
} from '../notification/notification.service.js'
import {
  upsertRateMasterEntries,
  RATE_MASTER_TYPE,
} from '../rateMaster/rateMaster.service.js'

const OBJECT_ID_REGEX = /^[a-fA-F0-9]{24}$/
const PRO_BUCKET_HOD_ROLES = ['head_of_department', 'hod']
const BACK_OFFICE_ROLES = [
  'back_office_exicutive',
  'back_office_executive',
  'boe',
]

const toOid = (v) => {
  if (v == null || v === '') return null
  if (!OBJECT_ID_REGEX.test(String(v))) return null
  return new mongoose.Types.ObjectId(String(v))
}

const supplierSnapshot = (sup) => {
  if (!sup) return null
  const o = typeof sup.toObject === 'function' ? sup.toObject() : { ...sup }
  delete o.password
  return o
}

const mergeUniqueIds = (...lists) => {
  const seen = new Set()
  const out = []
  for (const list of lists) {
    for (const id of list || []) {
      const key = String(id || '')
      if (!key || seen.has(key)) continue
      seen.add(key)
      out.push(key)
    }
  }
  return out
}

const notifyRateSubmittedRecipients = async ({
  io,
  queryBranchId,
  submitterBranchId,
  doc,
  queryProductId,
  status,
}) => {
  if (!doc?._id) return

  try {
    const branchIdsForHods = mergeUniqueIds([queryBranchId, submitterBranchId])

    const [hodResults, backOfficeEmployeeIds] = await Promise.all([
      Promise.all(
        branchIdsForHods.map((bid) =>
          getEmployeeIdsByRoles({
            branchId: bid,
            roles: PRO_BUCKET_HOD_ROLES,
          })
        )
      ),
      getEmployeeIdsByRoles({ roles: BACK_OFFICE_ROLES }),
    ])
    const queryBranchHodIds = queryBranchId ? hodResults[0] || [] : []
    const submitterBranchHodIds = submitterBranchId
      ? hodResults[branchIdsForHods.indexOf(String(submitterBranchId))] || []
      : []
    const hodEmployeeIds = mergeUniqueIds(...hodResults)
    const recipientEmployeeIds = mergeUniqueIds(
      hodEmployeeIds,
      backOfficeEmployeeIds
    )

    console.info(
      '[proBucket][notify] queryProductId=%s queryBranchId=%s submitterBranchId=%s hodCount=%d boeCount=%d totalRecipients=%d',
      String(queryProductId),
      queryBranchId ? String(queryBranchId) : 'null',
      submitterBranchId ? String(submitterBranchId) : 'null',
      hodEmployeeIds.length,
      backOfficeEmployeeIds.length,
      recipientEmployeeIds.length
    )

    if (!recipientEmployeeIds.length) {
      console.warn(
        '[proBucket][notify] No HOD/BOE recipients resolved; skipping notification'
      )
      return
    }

    const qCode = doc?.queryCode || doc?.queryId?.queryCode || ''
    const productName = doc?.productName || 'Product line'
    const isFulfilled = String(status || '') === 'fulfilled'

    const result = await createNotifications({
      title: isFulfilled
        ? 'Pro bucket: rates complete'
        : 'Pro bucket: rate submitted',
      description: isFulfilled
        ? `Query ${qCode}: "${productName}" has three rates (fulfilled).`
        : `Query ${qCode}: "${productName}" has new supplier rate(s) submitted.`,
      employeeIds: recipientEmployeeIds,
      io,
      metadata: {
        eventType: isFulfilled
          ? 'pro_bucket_fulfilled'
          : 'pro_bucket_rate_submitted',
        queryProductId: String(queryProductId),
        queryId: String(doc?.queryId?._id || doc?.queryId || ''),
        queryCode: String(qCode || ''),
        queryBranchId: queryBranchId ? String(queryBranchId) : '',
        submitterBranchId: submitterBranchId ? String(submitterBranchId) : '',
        productName,
        status: String(status || ''),
        recipientEmployeeIds,
        hodEmployeeIds: hodEmployeeIds.map(String),
        queryBranchHodIds: queryBranchHodIds.map(String),
        submitterBranchHodIds: submitterBranchHodIds.map(String),
        backOfficeEmployeeIds: backOfficeEmployeeIds.map(String),
      },
    })

    console.info(
      '[proBucket][notify] inserted=%d socketEmitted=%s',
      result?.count || 0,
      io ? 'yes' : 'no'
    )
  } catch (err) {
    console.error('Failed to notify pro bucket rate recipients', err)
  }
}

const PRO_BUCKET_LIST_STATUSES = new Set([
  'pending',
  'rate_submitted',
  'fulfilled',
  'approval_pending',
])

/** `createdAt` range (document timestamps); start/end of local calendar day. */
const createdAtRangeFilter = (from, to) => {
  const range = {}
  if (from != null && String(from).trim() !== '') {
    const d = new Date(from)
    if (!Number.isNaN(d.getTime())) {
      d.setHours(0, 0, 0, 0)
      range.$gte = d
    }
  }
  if (to != null && String(to).trim() !== '') {
    const d = new Date(to)
    if (!Number.isNaN(d.getTime())) {
      d.setHours(23, 59, 59, 999)
      range.$lte = d
    }
  }
  return Object.keys(range).length ? { createdAt: range } : {}
}

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Case-insensitive substring match on `query_products` text fields. */
const textSearchFilter = (search) => {
  const t = search != null ? String(search).trim() : ''
  if (!t) return {}
  const rx = new RegExp(escapeRegex(t), 'i')
  return {
    $or: [
      { queryCode: rx },
      { productName: rx },
      { rawProductCode: rx },
      { unit: rx },
      { hsnNumber: rx },
      { description: rx },
    ],
  }
}

const queryCodeSearchFilter = (search) => {
  const t = search != null ? String(search).trim() : ''
  if (!t) return {}
  return { queryCode: new RegExp(escapeRegex(t), 'i') }
}

/**
 * List `query_products` with pagination (no server-side RBAC; optional filters only).
 * Optional `status`, `from` / `to` on `createdAt`, `search` on text fields.
 * @param {object} q
 */
export const listProBucketQueryProducts = async (q) => {
  const page = Math.max(
    1,
    parseInt(String(q.page || q.pageNumber || 1), 10) || 1
  )
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(String(q.pageSize || q.limit || 20), 10) || 20)
  )

  const statusRaw =
    q.status != null && q.status !== '' ? String(q.status).trim() : ''
  const groupOid = toOid(q.groupId)
  const categoryOid = toOid(q.categoryId)

  const filter = {
    isDeleted: false,
    ...(statusRaw && PRO_BUCKET_LIST_STATUSES.has(statusRaw)
      ? { status: statusRaw }
      : {}),
    ...(groupOid ? { groupId: groupOid } : {}),
    ...(categoryOid ? { categoryId: categoryOid } : {}),
    ...createdAtRangeFilter(q.from, q.to),
    ...textSearchFilter(q.search),
  }

  const pendingFilter = {
    isDeleted: false,
    status: 'pending',
    ...(groupOid ? { groupId: groupOid } : {}),
    ...(categoryOid ? { categoryId: categoryOid } : {}),
    ...createdAtRangeFilter(q.from, q.to),
    ...textSearchFilter(q.search),
  }

  const [total, pendingCount, rawRows] = await Promise.all([
    countQueryProducts(filter),
    countQueryProducts(pendingFilter),
    findQueryProductsForProBucketList(filter, {
      skip: (page - 1) * pageSize,
      limit: pageSize,
    }),
  ])

  const rows = await Promise.all(
    rawRows.map(async (row) => {
      if (Array.isArray(row.images) && row.images.length > 0) {
        row.images = await transformPathsToSignedUrls(row.images)
      }
      return row
    })
  )

  return {
    data: rows,
    total,
    pendingCount,
    page,
    pageSize,
    assignedGroups: [],
  }
}

const withQueryProductPopulates = (id) =>
  findQueryProductByIdWithProBucketPopulates(id)

/** HOD rate-management snapshot for a query product line. */
export const buildRateManagementSnapshot = async (doc) => {
  const submittedRates = Array.isArray(doc?.rates) ? doc.rates : []
  const rateValues = submittedRates
    .map((r) => Number(r?.rate))
    .filter((n) => Number.isFinite(n) && n >= 0)

  const submittedRateUnit =
    (submittedRates.length
      ? String(submittedRates[submittedRates.length - 1]?.unit || '').trim()
      : '') || String(doc?.unit || '').trim()

  const proCode = String(doc?.rawProductCode || '').trim()
  let hodRows = []
  if (proCode) {
    hodRows = await findProductlHodRatesByProCode(proCode)
  }

  const pendingRows = hodRows.filter(
    (r) => r.status === PRODUCTL_HOD_RATE_STATUS.HOD_APPROVAL_PENDING
  )
  const sourceRows = pendingRows.length ? pendingRows : hodRows

  let minRate = 0
  let maxRate = 0
  let discount = 0

  if (sourceRows.length) {
    const mins = sourceRows
      .map((r) => Number(r.min_rate))
      .filter((n) => Number.isFinite(n))
    const maxs = sourceRows
      .map((r) => Number(r.max_rate))
      .filter((n) => Number.isFinite(n))
    minRate = mins.length ? Math.min(...mins) : 0
    maxRate = maxs.length ? Math.max(...maxs) : 0
    discount = Number(sourceRows[0]?.discount) || 0
  }

  const hodRateStatus = hodRows[0]?.status || sourceRows[0]?.status || null
  const isHodRateApproved =
    hodRows.some((r) => r.status === PRODUCTL_HOD_RATE_STATUS.HOD_APPROVED) ||
    hodRateStatus === PRODUCTL_HOD_RATE_STATUS.HOD_APPROVED

  return {
    proCode,
    submittedRateUnit,
    minRate,
    maxRate,
    discount,
    hasSubmittedRates: rateValues.length > 0,
    hasHodRates: hodRows.length > 0,
    hodRateStatus,
    isHodRateApproved,
  }
}

/** Load one `query_product` by id (not deleted). No group/branch checks. */
export const getProBucketQueryProductById = async (id) => {
  const oid = toOid(id)
  if (!oid) return null

  const exists = await findQueryProductByIdSelectId({
    _id: oid,
    isDeleted: false,
  })
  if (!exists) return null

  const doc = await withQueryProductPopulates(oid)
  if (doc?.images?.length) {
    doc.images = await transformPathsToSignedUrls(doc.images)
  }
  if (doc) {
    doc.rateManagement = await buildRateManagementSnapshot(doc)
  }
  return doc
}

const resolveSubmittedRateUnit = (queryProduct) => {
  const submittedRates = Array.isArray(queryProduct?.rates)
    ? queryProduct.rates
    : []
  return (
    (submittedRates.length
      ? String(submittedRates[submittedRates.length - 1]?.unit || '').trim()
      : '') || String(queryProduct?.unit || '').trim()
  )
}

const resolveQueryCodeForProduct = async (queryProduct) => {
  const direct = String(queryProduct?.queryCode || '').trim()
  if (direct) return direct

  const qid = toOid(queryProduct?.queryId)
  if (!qid) return ''

  const query = await findQueryByIdSelectQueryCode(qid)
  const fromQuery = String(query?.queryCode || '').trim()
  if (!fromQuery) return ''

  const productId = toOid(queryProduct?._id)
  if (productId) {
    await findByIdAndUpdateQueryProductQueryCode(productId, fromQuery)
  }

  return fromQuery
}

/** Update min/max/discount on pending `productl_hod_rates` for this line's pro_code. */
export const updateQueryProductHodRates = async (id, payload, user = null) => {
  const oid = toOid(id)
  if (!oid) throw new Error('Invalid id')

  const existing = await queryProductRepository
    .findOne({
      _id: oid,
      isDeleted: false,
    })
    .lean()
  if (!existing) return null

  const proCode = String(existing.rawProductCode || '').trim()
  if (!proCode) {
    throw new Error('Raw product code is required to update rates')
  }

  const queryCode = await resolveQueryCodeForProduct(existing)
  if (!queryCode) {
    throw new Error('Query code is required to update rates')
  }

  const queryId = toOid(existing.queryId)
  if (!queryId) {
    throw new Error('Query reference is required to update rates')
  }

  const minRate = Number(payload.minRate)
  const maxRate = Number(payload.maxRate)
  const discount = Number(payload.discount ?? 0)

  if (!Number.isFinite(minRate) || minRate < 0) {
    throw new Error('Invalid minimum rate')
  }
  if (!Number.isFinite(maxRate) || maxRate < 0) {
    throw new Error('Invalid maximum rate')
  }
  if (minRate > maxRate) {
    throw new Error('Minimum rate cannot exceed maximum rate')
  }
  if (!Number.isFinite(discount) || discount < 0 || discount > 100) {
    throw new Error('Discount must be between 0 and 100')
  }

  const submittedRateUnit = resolveSubmittedRateUnit(existing)
  const hodRateSet = {
    min_rate: minRate,
    max_rate: maxRate,
    discount,
    status: PRODUCTL_HOD_RATE_STATUS.HOD_APPROVED,
  }

  const pendingFilter = {
    pro_code: proCode,
    isDeleted: false,
    status: PRODUCTL_HOD_RATE_STATUS.HOD_APPROVAL_PENDING,
  }

  const pendingResult = await updateManyPendingProductlHodRates(
    pendingFilter,
    {
      $set: hodRateSet,
    }
  )

  if (!pendingResult.matchedCount) {
    const approvedResult = await updateManyApprovedProductlHodRates(
      {
        pro_code: proCode,
        isDeleted: false,
        status: PRODUCTL_HOD_RATE_STATUS.HOD_APPROVED,
      },
      { $set: { min_rate: minRate, max_rate: maxRate, discount } }
    )

    if (!approvedResult.matchedCount) {
      await createProductlHodRate({
        pro_code: proCode,
        ...hodRateSet,
        unit: submittedRateUnit,
      })
    }
  }

  const updatedBy = toOid(user?.id || user?._id)

  const historyDoc = await createProductHodRateHistory({
    queryCode,
    queryId,
    queryProductId: oid,
    pro_code: proCode,
    min_rate: minRate,
    max_rate: maxRate,
    unit: submittedRateUnit,
    discount,
    status: PRODUCTL_HOD_RATE_STATUS.HOD_APPROVED,
    updatedBy,
  })

  console.info(
    '[proBucket][hod-rates] history saved id=%s queryCode=%s pro_code=%s queryProductId=%s',
    String(historyDoc?._id || ''),
    queryCode,
    proCode,
    String(oid)
  )

  await findByIdAndUpdateQueryProductHodApproved(oid)

  return getProBucketQueryProductById(String(oid))
}

const mapHodRateHistoryRow = (row) => ({
  id: row._id,
  queryCode: row.queryCode || '',
  queryId: row.queryId,
  queryProductId: row.queryProductId,
  proCode: row.pro_code || '',
  minRate: row.min_rate,
  maxRate: row.max_rate,
  unit: row.unit || '',
  discount: row.discount ?? 0,
  status: row.status || '',
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
  updatedBy: row.updatedBy,
})

/** Paginated HOD rate history for a product (`pro_code`), newest first. HOD only. */
export const listQueryProductHodRateHistories = async (id, q = {}, user = null) => {
  const role = String(user?.role || '').toLowerCase()
  if (!PRO_BUCKET_HOD_ROLES.includes(role)) {
    throw new Error('Only Head of Department can view rate history')
  }

  const oid = toOid(id)
  if (!oid) throw new Error('Invalid id')

  const existing = await findQueryProductByIdSelectRawProductCode({
    _id: oid,
    isDeleted: false,
  })
  if (!existing) return null

  const proCode = String(existing.rawProductCode || '').trim()
  const page = Math.max(
    1,
    parseInt(String(q.page || q.pageNumber || 1), 10) || 1
  )
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(String(q.pageSize || q.limit || 10), 10) || 10)
  )

  if (!proCode) {
    return {
      data: [],
      total: 0,
      page,
      pageSize,
      totalPages: 1,
    }
  }

  const filter = {
    pro_code: proCode,
    isDeleted: false,
    ...createdAtRangeFilter(q.from, q.to),
    ...queryCodeSearchFilter(q.search),
  }

  const [total, rows] = await Promise.all([
    countProductHodRateHistories(filter),
    findProductHodRateHistories(filter, {
      skip: (page - 1) * pageSize,
      limit: pageSize,
    }),
  ])

  return {
    data: rows.map(mapHodRateHistoryRow),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize) || 1),
  }
}

export const appendProBucketRates = async (id, ratesInput, user, io = null) => {
  const oid = toOid(id)
  if (!oid) throw new Error('Invalid id')

  const existing = await queryProductRepository
    .findOne({
      _id: oid,
      isDeleted: false,
    })
    .lean()
  if (!existing) {
    return null
  }

  const toPush = []
  for (const r of ratesInput) {
    const supId = toOid(r?.supplierId)
    let supSnap = null
    if (supId) {
      const sup = await findSupplierByIdSelectFields(
        supId,
        'uniqueId name shopname address shippingAddress billingAddress phone_1 phone_2 email other_contact label shop_location gst categories remark catalog branchId'
      )
      if (!sup) {
        throw new Error('Supplier not found: ' + String(r.supplierId))
      }
      supSnap = supplierSnapshot(sup)
      if (supSnap) supSnap._id = supId
    }
    toPush.push({
      supplier: supSnap,
      rate: Number(r.rate),
      unit: (r.unit && String(r.unit).trim()) || '',
      remark: (r.remark && String(r.remark)) || '',
      submittedAt: new Date(),
      submittedBy: toOid(user?.id ?? user?._id),
    })
  }

  if (!toPush.length) {
    return getProBucketQueryProductById(String(oid))
  }

  const newLen = (existing.rates?.length || 0) + toPush.length
  const nextStatus = deriveProBucketStatus(newLen)

  await findByIdAndUpdateQueryProductRates(oid, {
    $push: { rates: { $each: toPush } },
    $set: { status: nextStatus },
  })

  const rawProductCode = String(existing.rawProductCode || '').trim()
  if (rawProductCode) {
    await insertManyProductlHodRates(
      toPush.map((r) => ({
        pro_code: rawProductCode,
        min_rate: r.rate,
        max_rate: r.rate,
        unit: r.unit || '',
        discount: 0,
        status: PRODUCTL_HOD_RATE_STATUS.HOD_APPROVAL_PENDING,
      }))
    )
  }

  try {
    const queryCode = await resolveQueryCodeForProduct(existing)
    if (queryCode && rawProductCode) {
      await upsertRateMasterEntries({
        type: RATE_MASTER_TYPE.PROCUREMENT,
        sourceCode: queryCode,
        sourceId: oid,
        branchId: existing.branchId || null,
        items: toPush.map((r) => ({
          productCode: rawProductCode,
          rate: r.rate,
          unit: r.unit,
          supplierSnapshot: r.supplier || null,
          snapshot: {
            queryProductId: String(oid),
            queryCode,
            productName: existing.productName || '',
            rawProductCode,
            rate: r.rate,
            unit: r.unit,
            supplier: r.supplier || null,
            remark: r.remark || '',
            submittedAt: r.submittedAt,
            submittedBy: r.submittedBy || null,
          },
        })),
      })
    }
  } catch (err) {
    console.error(
      '[proBucket] rate_master sync failed:',
      err?.message || err
    )
  }

  const doc = await getProBucketQueryProductById(String(oid))
  const nextStatusStr = String(doc?.status || '')

  let queryBranchId =
    doc?.queryId &&
    typeof doc.queryId === 'object' &&
    doc.queryId.branchId != null
      ? doc.queryId.branchId
      : null
  if (!queryBranchId && existing.queryId) {
    const q = await findQueryByIdSelectBranchId(existing.queryId)
    queryBranchId = q?.branchId || null
  }
  const submitterBranchId = user?.branchId || null

  console.info(
    '[proBucket][rates] appended id=%s addedRates=%d newStatus=%s queryBranchId=%s submitterBranchId=%s',
    String(oid),
    toPush.length,
    nextStatusStr,
    queryBranchId ? String(queryBranchId) : 'null',
    submitterBranchId ? String(submitterBranchId) : 'null'
  )

  await notifyRateSubmittedRecipients({
    io,
    queryBranchId,
    submitterBranchId,
    doc,
    queryProductId: oid,
    status: nextStatusStr,
  })

  return doc
}

/**
 * Update editable fields of a `query_product` document (patch semantics).
 */
export const updateQueryProduct = async (id, payload) => {
  const oid = toOid(id)
  if (!oid) throw new Error('Invalid id')

  const allowed = [
    'productName',
    'quantity',
    'unit',
    'hsnNumber',
    'modelNumber',
    'gstPercentage',
    'description',
    'remark',
    'groupId',
    'categoryId',
    'status',
    'rawProductCode',
    'query_tracking_code',
    'hodApproved',
  ]

  const update = {}
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(payload, key)) {
      if (key === 'groupId' || key === 'categoryId') {
        update[key] = toOid(payload[key]) || null
      } else if (key === 'quantity' || key === 'gstPercentage') {
        const n = Number(payload[key])
        update[key] = Number.isFinite(n) ? n : null
      } else {
        update[key] = payload[key] ?? null
      }
    }
  }

  if (Array.isArray(payload.images)) {
    update.images = payload.images
      .map((id) => toOid(id))
      .filter(Boolean)
  }

  if (Object.keys(update).length === 0) {
    throw new Error('No valid fields to update')
  }

  const doc = await findOneAndUpdateQueryProduct(
    { _id: oid, isDeleted: false },
    { $set: update },
    { new: true }
  )

  if (!doc) return null

  if (Array.isArray(doc.images) && doc.images.length > 0) {
    doc.images = await transformPathsToSignedUrls(doc.images)
  }

  return doc
}
