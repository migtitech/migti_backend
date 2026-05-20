import mongoose from 'mongoose'
import QueryModel from '../../models/query.model.js'
import QueryProductModel, {
  deriveProBucketStatus,
} from '../../models/queryProduct.model.js'
import SupplierModel from '../../models/supplier.model.js'
import { transformPathsToSignedUrls } from '../document/document.service.js'
import {
  createNotifications,
  getEmployeeIdsByRoles,
} from '../notification/notification.service.js'

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
    QueryProductModel.countDocuments(filter),
    QueryProductModel.countDocuments(pendingFilter),
    QueryProductModel.find(filter)
      .sort({ createdAt: -1, lineIndex: 1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .populate('groupId', 'name _id')
      .populate('categoryId', 'name _id')
      .populate('images', 'name path mimetype _id')
      .lean(),
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

const withQueryProductPopulates = (q) =>
  q
    .populate('groupId', 'name')
    .populate('categoryId', 'name')
    .populate('product_id', 'name')
    .populate(
      'queryId',
      'queryCode query_tracking_code status companyInfo branchId'
    )
    .populate('images', 'name path mimetype')
    .lean()

/** Load one `query_product` by id (not deleted). No group/branch checks. */
export const getProBucketQueryProductById = async (id) => {
  const oid = toOid(id)
  if (!oid) return null

  const exists = await QueryProductModel.findOne({
    _id: oid,
    isDeleted: false,
  })
    .select('_id')
    .lean()
  if (!exists) return null

  const doc = await withQueryProductPopulates(QueryProductModel.findById(oid))
  if (doc?.images?.length) {
    doc.images = await transformPathsToSignedUrls(doc.images)
  }
  return doc
}

export const appendProBucketRates = async (id, ratesInput, user, io = null) => {
  const oid = toOid(id)
  if (!oid) throw new Error('Invalid id')

  const existing = await QueryProductModel.findOne({
    _id: oid,
    isDeleted: false,
  }).lean()
  if (!existing) {
    return null
  }

  const toPush = []
  for (const r of ratesInput) {
    const supId = toOid(r?.supplierId)
    let supSnap = null
    if (supId) {
      const sup = await SupplierModel.findById(supId)
        .select(
          'uniqueId name shopname address shippingAddress billingAddress phone_1 phone_2 email other_contact label shop_location gst categories remark catalog branchId'
        )
        .lean()
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

  await QueryProductModel.findByIdAndUpdate(oid, {
    $push: { rates: { $each: toPush } },
    $set: { status: nextStatus },
  })

  const doc = await getProBucketQueryProductById(String(oid))
  const nextStatusStr = String(doc?.status || '')

  let queryBranchId =
    doc?.queryId &&
    typeof doc.queryId === 'object' &&
    doc.queryId.branchId != null
      ? doc.queryId.branchId
      : null
  if (!queryBranchId && existing.queryId) {
    const q = await QueryModel.findById(existing.queryId)
      .select('branchId')
      .lean()
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

  const doc = await QueryProductModel.findOneAndUpdate(
    { _id: oid, isDeleted: false },
    { $set: update },
    { new: true }
  )
    .populate('groupId', 'name _id')
    .populate('categoryId', 'name _id')
    .populate('images', 'name path mimetype _id')
    .lean()

  if (!doc) return null

  if (Array.isArray(doc.images) && doc.images.length > 0) {
    doc.images = await transformPathsToSignedUrls(doc.images)
  }

  return doc
}
