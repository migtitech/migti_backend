import mongoose from 'mongoose'
import QueryProductModel, {
  deriveProBucketStatus,
} from '../../models/queryProduct.model.js'
import SupplierModel from '../../models/supplier.model.js'
import { transformPathsToSignedUrls } from '../document/document.service.js'

const OBJECT_ID_REGEX = /^[a-fA-F0-9]{24}$/

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

const PRO_BUCKET_LIST_STATUSES = new Set([
  'pending',
  'rate_submitted',
  'fulfilled',
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
  const filter = {
    isDeleted: false,
    ...(statusRaw && PRO_BUCKET_LIST_STATUSES.has(statusRaw)
      ? { status: statusRaw }
      : {}),
    ...createdAtRangeFilter(q.from, q.to),
    ...textSearchFilter(q.search),
  }

  const pendingFilter = {
    isDeleted: false,
    status: 'pending',
    ...createdAtRangeFilter(q.from, q.to),
    ...textSearchFilter(q.search),
  }

  const [total, pendingCount, rows] = await Promise.all([
    QueryProductModel.countDocuments(filter),
    QueryProductModel.countDocuments(pendingFilter),
    QueryProductModel.find(filter)
      .sort({ createdAt: -1, lineIndex: 1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
  ])

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
    .populate('queryId', 'queryCode query_tracking_code status companyInfo')
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

export const appendProBucketRates = async (id, ratesInput, user) => {
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

  return getProBucketQueryProductById(String(oid))
}
