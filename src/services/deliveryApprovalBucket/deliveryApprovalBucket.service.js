import PoProductModel from '../../models/poProduct.model.js'
import CustomError from '../../utils/exception.js'
import { statusCodes, errorCodes } from '../../core/common/constant.js'
import {
  buildBaseStages,
  loadPoProductForAccess,
  getPurchaseBucketPoProductById,
} from '../purchaseBucket/purchaseBucket.service.js'
import {
  PO_PRODUCT_INVENTORY_STATUS,
  resolvePoProductLineStatus,
} from '../../models/poProduct.model.js'
import mongoose from 'mongoose'

const OBJECT_ID_REGEX = /^[a-fA-F0-9]{24}$/

const toOid = (v) => {
  if (v == null || v === '') return null
  if (!OBJECT_ID_REGEX.test(String(v))) return null
  return new mongoose.Types.ObjectId(String(v))
}

export const DELIVERY_SUBSTATUS_HOD_PENDING = 'hod_approval_pending'
export const DELIVERY_SUBSTATUS_HOD_APPROVED = 'delivery_approved_by_hod'

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * PO lines for the PO Products bucket.
 * When `deliverySubStatus` is provided it filters on that value; defaults to `hod_approval_pending`.
 * Pass `deliverySubStatus: ''` (or `'all'`) to see all lines regardless of sub-status.
 */
export const listDeliveryApprovalQueuePoProducts = async (q, _user) => {
  const page = Math.max(
    1,
    parseInt(String(q.page || q.pageNumber || 1), 10) || 1
  )
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(String(q.pageSize || q.limit || 20), 10) || 20)
  )
  const { search, from, to } = q

  const rawSubStatus = String(
    q.deliverySubStatus ?? DELIVERY_SUBSTATUS_HOD_PENDING
  ).trim()
  const filterBySubStatus = rawSubStatus !== '' && rawSubStatus !== 'all'

  const rawStatus = q.status ? String(q.status).trim() : ''

  const base = buildBaseStages()
  const stages = [...base]
  stages.push({
    $addFields: {
      _lineStatus: {
        $ifNull: ['$status', { $ifNull: ['$inventoryStatus', 'pending'] }],
      },
    },
  })

  if (filterBySubStatus) {
    stages.push({ $match: { deliverySubStatus: rawSubStatus } })
  }

  if (rawStatus) {
    stages.push({ $match: { _lineStatus: rawStatus } })
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
    stages.push({ $match: { createdAt: dr } })
  }

  if (search && String(search).trim()) {
    const rx = new RegExp(escapeRegex(String(search).trim()), 'i')
    stages.push({
      $match: {
        $or: [
          { productName: rx },
          { poCode: rx },
          { rawProductCode: rx },
          { 'poArr.poCode': rx },
        ],
      },
    })
  }

  const countPipeline = [...stages, { $count: 'c' }]
  const countRes = await PoProductModel.aggregate(countPipeline)
  const total = countRes[0]?.c || 0

  const listPipeline = [
    ...stages,
    { $sort: { updatedAt: -1, createdAt: -1 } },
    { $skip: (page - 1) * pageSize },
    { $limit: pageSize },
    {
      $project: {
        _id: 1,
        productName: 1,
        rawProductCode: 1,
        poCode: 1,
        dispatchmentDate: 1,
        deliverySubStatus: 1,
        status: '$_lineStatus',
        procurementStatus: { $ifNull: ['$procurementStatus', 'open'] },
        purchaseOrderId: 1,
        lineIndex: 1,
        quantity: 1,
        unit: 1,
        hsnNumber: 1,
        modelNumber: 1,
        gstPercentage: 1,
        remark: 1,
        description: 1,
        companyInfo: 1,
        effectiveGroupId: 1,
        priority: { $ifNull: ['$priority', 'medium'] },
        createdAt: 1,
        updatedAt: 1,
      },
    },
  ]
  const data = await PoProductModel.aggregate(listPipeline)

  return { data, total, page, pageSize }
}

export const getDeliveryApprovalPoProductById = async (id, user) => {
  const doc = await getPurchaseBucketPoProductById(id, user)
  if (!doc) return null
  const line = resolvePoProductLineStatus(doc)
  if (line !== PO_PRODUCT_INVENTORY_STATUS.DELIVERED) return null
  if (
    String(doc.deliverySubStatus || '').trim() !==
    DELIVERY_SUBSTATUS_HOD_PENDING
  ) {
    return null
  }
  return doc
}

/**
 * Get any po_product by id (no deliverySubStatus restriction) for the PO Products bucket page.
 */
export const getPoProductBucketById = async (id, user) => {
  return getPurchaseBucketPoProductById(id, user)
}

/**
 * Update enrichment fields on a po_product (remark, description, HSN, model, GST).
 * Any role can enrich; restricted fields like status must go via their own endpoints.
 */
export const updatePoProductEnrichment = async (id, body) => {
  const oid = toOid(id)
  if (!oid) return null

  const allowed = await PoProductModel.findOne({
    _id: oid,
    isDeleted: false,
  }).lean()
  if (!allowed) return null

  const update = {}
  if (body.remark !== undefined)
    update.remark = String(body.remark ?? '').trim()
  if (body.description !== undefined)
    update.description = String(body.description ?? '').trim()
  if (body.targetRate !== undefined) {
    update.targetRate = body.targetRate != null ? Number(body.targetRate) : null
  }
  if (body.quantity !== undefined) update.quantity = Number(body.quantity)
  if (body.status !== undefined) update.status = body.status

  if (!Object.keys(update).length)
    return getPurchaseBucketPoProductById(String(oid), {})

  await PoProductModel.findOneAndUpdate(
    { _id: oid, isDeleted: false },
    { $set: update },
    { new: true }
  )

  return getPurchaseBucketPoProductById(String(oid), {})
}

/**
 * Return up to 5 distinct poCode values that contain the search string (case-insensitive).
 */
export const getPoCodeSuggestions = async (search) => {
  const term = String(search || '').trim()
  if (!term) return []
  const rx = new RegExp(escapeRegex(term), 'i')
  const results = await PoProductModel.aggregate([
    { $match: { poCode: rx, isDeleted: false } },
    { $group: { _id: '$poCode' } },
    { $sort: { _id: 1 } },
    { $limit: 5 },
  ])
  return results.map((r) => r._id).filter(Boolean)
}

export const createPoProduct = async (body) => {
  const purchaseOrderId = toOid(body.purchaseOrderId)
  if (!purchaseOrderId) return null

  const maxLine = await PoProductModel.findOne({ purchaseOrderId })
    .sort({ lineIndex: -1 })
    .select('lineIndex')
    .lean()
  const nextLineIndex = maxLine ? maxLine.lineIndex + 1 : 0

  const doc = new PoProductModel({
    purchaseOrderId,
    poCode: String(body.poCode || '').trim(),
    lineIndex: nextLineIndex,
    productName: String(body.productName || '').trim(),
    quantity: Number(body.quantity) || 0,
    unit: String(body.unit || '').trim(),
    rawProductCode: String(body.rawProductCode || '').trim(),
    hsnNumber: String(body.hsnNumber || '').trim(),
    modelNumber: String(body.modelNumber || '').trim(),
    gstPercentage:
      body.gstPercentage != null ? Number(body.gstPercentage) : null,
    description: String(body.description || '').trim(),
    remark: String(body.remark || '').trim(),
    targetRate: body.targetRate != null ? Number(body.targetRate) : null,
    companyInfo: body.companyInfo || {},
    status: 'hod_approval_pending',
    procurementStatus: 'open',
  })

  await doc.save()
  return doc.toObject()
}

export const approveDeliveryByHod = async (id, user) => {
  const allowed = await loadPoProductForAccess(id)
  if (!allowed) return null
  const cur = resolvePoProductLineStatus(allowed)
  if (cur !== PO_PRODUCT_INVENTORY_STATUS.DELIVERED) {
    throw new CustomError(
      statusCodes.badRequest,
      'Line must be marked delivered before HOD approval',
      errorCodes.bad_request
    )
  }
  if (
    String(allowed.deliverySubStatus || '').trim() !==
    DELIVERY_SUBSTATUS_HOD_PENDING
  ) {
    throw new CustomError(
      statusCodes.badRequest,
      'This line is not awaiting HOD delivery approval',
      errorCodes.bad_request
    )
  }
  const approverId = toOid(user?.id || user?._id)
  await PoProductModel.findOneAndUpdate(
    { _id: allowed._id, isDeleted: false },
    {
      $set: {
        deliverySubStatus: DELIVERY_SUBSTATUS_HOD_APPROVED,
        deliveryApprovedBy: approverId,
        deliveryApprovedAt: new Date(),
      },
      $unset: { inventoryStatus: 1 },
    },
    { new: true }
  )
  return getPurchaseBucketPoProductById(String(allowed._id), user)
}
