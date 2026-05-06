import PoProductModel from '../../models/poProduct.model.js'
import DocumentModel from '../../models/document.model.js'
import { statusCodes, errorCodes } from '../../core/common/constant.js'
import CustomError from '../../utils/exception.js'
import {
  buildBaseStages,
  loadPoProductForAccess,
} from '../purchaseBucket/purchaseBucket.service.js'
import {
  PO_PRODUCT_INVENTORY_STATUS,
  resolvePoProductLineStatus,
} from '../../models/poProduct.model.js'

const OBJECT_ID_REGEX = /^[a-fA-F0-9]{24}$/

const isImageDocumentRecord = (doc) => {
  if (!doc || typeof doc !== 'object') return false
  const mime = doc.mimeType != null ? String(doc.mimeType) : ''
  if (mime && /^image\//i.test(mime)) return true
  const path = doc.path != null ? String(doc.path) : ''
  return path ? /\.(jpe?g|png|gif|webp|bmp)$/i.test(path) : false
}

const normalizeReceivingRemark = (remark) => {
  if (remark == null || remark === '') return ''
  const s = String(remark).trim()
  return s.length > 4000 ? s.slice(0, 4000) : s
}

const toObjectIdOrNull = (v) => {
  if (v == null || v === '') return null
  const s = String(v).trim()
  return OBJECT_ID_REGEX.test(s) ? s : null
}

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const DISPATCH_LINE_STATUSES = [
  PO_PRODUCT_INVENTORY_STATUS.READY_FOR_DISPATCHMENT,
  PO_PRODUCT_INVENTORY_STATUS.DELIVERED,
]

/**
 * PO product lines: `ready_for_dispatchment` and `delivered` (dispatch / fulfillment history).
 */
export const listDispatchmentQueuePoProducts = async (q, _user) => {
  const page = Math.max(
    1,
    parseInt(String(q.page || q.pageNumber || 1), 10) || 1
  )
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(String(q.pageSize || q.limit || 20), 10) || 20)
  )
  const { search, from, to, status } = q

  const base = buildBaseStages()
  const stages = [...base]
  stages.push({
    $addFields: {
      _lineStatus: {
        $ifNull: ['$status', { $ifNull: ['$inventoryStatus', 'pending'] }],
      },
    },
  })

  stages.push({
    $match: { _lineStatus: { $in: DISPATCH_LINE_STATUSES } },
  })

  const statusTrim = status != null ? String(status).trim() : ''
  if (
    statusTrim === PO_PRODUCT_INVENTORY_STATUS.READY_FOR_DISPATCHMENT ||
    statusTrim === PO_PRODUCT_INVENTORY_STATUS.DELIVERED
  ) {
    stages.push({ $match: { _lineStatus: statusTrim } })
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
    { $sort: { dispatchmentDate: 1, createdAt: -1 } },
    { $skip: (page - 1) * pageSize },
    { $limit: pageSize },
    {
      $project: {
        _id: 1,
        productName: 1,
        rawProductCode: 1,
        poCode: 1,
        dispatchmentDate: 1,
        status: '$_lineStatus',
        procurementStatus: { $ifNull: ['$procurementStatus', 'open'] },
        purchaseOrderId: 1,
        lineIndex: 1,
        quantity: 1,
        unit: 1,
        companyInfo: 1,
        effectiveGroupId: 1,
        createdAt: 1,
      },
    },
  ]
  const data = await PoProductModel.aggregate(listPipeline)

  return { data, total, page, pageSize }
}

/**
 * Mark line delivered (from `ready_for_dispatchment` only). Updates `po_products.status`,
 * and optionally `receivingDocumentId` + `receivingRemark`.
 */
export const markPoProductDelivered = async (
  id,
  _user,
  { receivingDocumentId = null, receivingRemark } = {}
) => {
  const allowed = await loadPoProductForAccess(id)
  if (!allowed) return null
  const cur = resolvePoProductLineStatus(allowed)
  if (cur === PO_PRODUCT_INVENTORY_STATUS.DELIVERED) {
    return await PoProductModel.findById(allowed._id).lean()
  }
  if (cur !== PO_PRODUCT_INVENTORY_STATUS.READY_FOR_DISPATCHMENT) {
    throw new CustomError(
      statusCodes.badRequest,
      'Mark ready for dispatchment before marking delivered',
      errorCodes.bad_request
    )
  }
  const docId = toObjectIdOrNull(receivingDocumentId)
  if (!docId) {
    throw new CustomError(
      statusCodes.badRequest,
      'Receiving proof image is required to mark delivered',
      errorCodes.bad_request
    )
  }
  const recvDoc = await DocumentModel.findById(docId).lean()
  if (!recvDoc || !isImageDocumentRecord(recvDoc)) {
    throw new CustomError(
      statusCodes.badRequest,
      'Receiving proof must be an image file',
      errorCodes.bad_request
    )
  }
  const setPayload = {
    status: PO_PRODUCT_INVENTORY_STATUS.DELIVERED,
    deliverySubStatus: 'hod_approval_pending',
    deliveryApprovedBy: null,
    deliveryApprovedAt: null,
    receivingDocumentId: docId,
  }
  if (receivingRemark !== undefined) {
    setPayload.receivingRemark = normalizeReceivingRemark(receivingRemark)
  }
  return await PoProductModel.findOneAndUpdate(
    { _id: allowed._id, isDeleted: false },
    {
      $set: setPayload,
      $unset: { inventoryStatus: 1 },
    },
    { new: true }
  ).lean()
}
