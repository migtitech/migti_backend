import mongoose from 'mongoose'
import QueryProductModel, {
  deriveProBucketStatus,
} from '../../models/queryProduct.model.js'
import QueryModel from '../../models/query.model.js'
import EmployeeModel from '../../models/employee.model.js'
import SupplierModel from '../../models/supplier.model.js'
import { FULL_ACCESS_ROLES } from '../../core/common/constant.js'

const OBJECT_ID_REGEX = /^[a-fA-F0-9]{24}$/

const toOid = (v) => {
  if (v == null || v === '') return null
  if (!OBJECT_ID_REGEX.test(String(v))) return null
  return new mongoose.Types.ObjectId(String(v))
}

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const isFullAccessRole = (role) => {
  if (!role) return false
  return FULL_ACCESS_ROLES.map(String).includes(String(role))
}

const supplierSnapshot = (sup) => {
  if (!sup) return null
  const o = typeof sup.toObject === 'function' ? sup.toObject() : { ...sup }
  delete o.password
  return o
}

const buildBasePipeline = ({
  assignedGroups,
  fullAccess,
  branchId,
  from,
  to,
  search,
}) => {
  const baseMatch = { isDeleted: false }
  if (!fullAccess) {
    if (!assignedGroups?.length) {
      return null
    }
    baseMatch.groupId = {
      $in: assignedGroups.map((id) => toOid(id)).filter((id) => id != null),
    }
  }

  const pipeline = []
  pipeline.push({ $match: baseMatch })
  pipeline.push({
    $lookup: {
      from: 'queries',
      localField: 'queryId',
      foreignField: '_id',
      as: 'q',
    },
  })
  pipeline.push({ $unwind: { path: '$q' } })
  pipeline.push({ $match: { 'q.isDeleted': false } })

  if (!fullAccess && branchId) {
    const bid = toOid(branchId)
    if (bid) {
      pipeline.push({ $match: { 'q.branchId': bid } })
    }
  }

  if (from || to) {
    const dr = {}
    if (from) {
      const d = new Date(from)
      d.setHours(0, 0, 0, 0)
      dr.$gte = d
    }
    if (to) {
      const d = new Date(to)
      d.setHours(23, 59, 59, 999)
      dr.$lte = d
    }
    pipeline.push({ $match: { 'q.createdAt': dr } })
  }

  if (search && String(search).trim()) {
    const rx = new RegExp(escapeRegex(String(search).trim()), 'i')
    pipeline.push({
      $match: {
        $or: [{ productName: rx }, { queryCode: rx }],
      },
    })
  }

  return pipeline
}

/**
 * @param {object} q
 * @param {import('express').Request['user']} user
 */
export const listProBucketQueryProducts = async (q, user) => {
  const employee = await EmployeeModel.findById(user?.id)
    .select('assigned_groups role')
    .lean()
  if (!employee) {
    return { data: [], total: 0, pendingCount: 0, page: 1, pageSize: 20 }
  }

  const fullAccess = isFullAccessRole(employee.role)
  const page = Math.max(
    1,
    parseInt(String(q.page || q.pageNumber || 1), 10) || 1
  )
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(String(q.pageSize || q.limit || 20), 10) || 20)
  )
  const { search, from, to, status } = q
  const branchId = user?.branchId

  const base = buildBasePipeline({
    assignedGroups: employee.assigned_groups,
    fullAccess,
    branchId,
    from,
    to,
    search,
  })

  if (!base) {
    return { data: [], total: 0, pendingCount: 0, page, pageSize }
  }

  const pendingPipeline = [
    ...base,
    { $match: { status: 'pending' } },
    { $count: 'c' },
  ]
  const pendingRes = await QueryProductModel.aggregate(pendingPipeline)
  const pendingCount = pendingRes[0]?.c || 0

  const listPipeline = [...base]
  if (status && String(status).trim()) {
    listPipeline.push({ $match: { status: String(status).trim() } })
  }
  const countPipeline = [...listPipeline, { $count: 'c' }]
  const countRes = await QueryProductModel.aggregate(countPipeline)
  const total = countRes[0]?.c || 0

  listPipeline.push(
    { $sort: { 'q.createdAt': -1, lineIndex: 1 } },
    { $skip: (page - 1) * pageSize },
    { $limit: pageSize }
  )
  const data = await QueryProductModel.aggregate(listPipeline)
  const slim = data.map((row) => {
    const { q: qrow, ...rest } = row
    return {
      ...rest,
      query: qrow
        ? {
            _id: qrow._id,
            queryCode: qrow.queryCode,
            createdAt: qrow.createdAt,
          }
        : null,
    }
  })

  return { data: slim, total, pendingCount, page, pageSize }
}

const withQueryProductPopulates = (q) =>
  q
    .populate('groupId', 'name')
    .populate('categoryId', 'name')
    .populate('product_id', 'name')
    .populate('queryId', 'queryCode query_tracking_code status companyInfo')
    .populate('images', 'name path mimetype')
    .lean()

export const getProBucketQueryProductById = async (id, user) => {
  const oid = toOid(id)
  if (!oid) return null

  const employee = await EmployeeModel.findById(user?.id)
    .select('assigned_groups role branchId')
    .lean()
  if (!employee) return null

  const fullAccess = isFullAccessRole(employee.role)
  const doc = await QueryProductModel.findOne({
    _id: oid,
    isDeleted: false,
  }).lean()
  if (!doc) return null

  if (!fullAccess) {
    const gids = (employee.assigned_groups || []).map((g) => String(g))
    if (doc.groupId == null || !gids.includes(String(doc.groupId))) {
      return null
    }
    if (user?.branchId) {
      const qu = await QueryModel.findById(doc.queryId)
        .select('branchId')
        .lean()
      if (qu && String(qu.branchId) !== String(user.branchId)) {
        return null
      }
    }
  }

  return withQueryProductPopulates(QueryProductModel.findById(oid))
}

export const appendProBucketRates = async (id, ratesInput, user) => {
  const oid = toOid(id)
  if (!oid) throw new Error('Invalid id')

  const existing = await getProBucketQueryProductById(String(id), user)
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
      submittedBy: toOid(user?.id),
    })
  }

  if (!toPush.length) {
    return existing
  }

  const newLen = (existing.rates?.length || 0) + toPush.length
  const nextStatus = deriveProBucketStatus(newLen)

  await QueryProductModel.findByIdAndUpdate(oid, {
    $push: { rates: { $each: toPush } },
    $set: { status: nextStatus },
  })

  return getProBucketQueryProductById(String(oid), user)
}
