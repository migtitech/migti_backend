import poProductRepository, {
  PO_PRODUCT_INVENTORY_STATUS,
  resolvePoProductLineStatus,
} from '../../repository/poProduct.repository.js'
import { statusCodes, errorCodes } from '../../core/common/constant.js'
import CustomError from '../../utils/exception.js'
import {
  buildBaseStages,
  loadPoProductForAccess,
  getPurchaseBucketPoProductById,
} from '../purchaseBucket/purchaseBucket.service.js'

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export const listInventoryBucketPoProducts = async (q, _user) => {
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

  if (status && String(status).trim()) {
    const s = String(status).trim()
    const filterable = [
      PO_PRODUCT_INVENTORY_STATUS.PENDING,
      'purchased',
      PO_PRODUCT_INVENTORY_STATUS.INVENTORY_RECEIVED,
      PO_PRODUCT_INVENTORY_STATUS.READY_FOR_DISPATCHMENT,
      PO_PRODUCT_INVENTORY_STATUS.DELIVERED,
    ]
    if (filterable.includes(s)) {
      stages.push({ $match: { _lineStatus: s } })
    }
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

  const pendingPipeline = [
    ...stages,
    { $match: { _lineStatus: PO_PRODUCT_INVENTORY_STATUS.PENDING } },
    { $count: 'c' },
  ]
  const pendingRes = await poProductRepository.aggregate(pendingPipeline)
  const pendingCount = pendingRes[0]?.c || 0

  const countPipeline = [...stages, { $count: 'c' }]
  const countRes = await poProductRepository.aggregate(countPipeline)
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
  const data = await poProductRepository.aggregate(listPipeline)

  return { data, total, pendingCount, page, pageSize }
}

export const getInventoryBucketPoProductById = async (id, user) => {
  const doc = await getPurchaseBucketPoProductById(id, user)
  if (!doc) return null
  return { ...doc, status: resolvePoProductLineStatus(doc) }
}

export const markInventoryReceived = async (id, user) => {
  const allowed = await loadPoProductForAccess(id)
  if (!allowed) return null
  const cur = resolvePoProductLineStatus(allowed)
  if (cur === 'finance_approved') {
    return await poProductRepository.findById(allowed._id).lean()
  }
  if (cur === PO_PRODUCT_INVENTORY_STATUS.DELIVERED) {
    return await poProductRepository.findById(allowed._id).lean()
  }
  if (
    cur === PO_PRODUCT_INVENTORY_STATUS.INVENTORY_RECEIVED ||
    cur === PO_PRODUCT_INVENTORY_STATUS.READY_FOR_DISPATCHMENT
  ) {
    return await poProductRepository.findById(allowed._id).lean()
  }
  const updated = await poProductRepository.findOneAndUpdate(
    { _id: allowed._id, isDeleted: false },
    {
      $set: { status: PO_PRODUCT_INVENTORY_STATUS.INVENTORY_RECEIVED },
      $unset: { inventoryStatus: 1 },
    },
    { new: true }
  ).lean()
  return updated
}

/**
 * After goods are received, mark line ready for dispatch (next step in workflow).
 */
export const markReadyForDispatchment = async (id, user) => {
  const allowed = await loadPoProductForAccess(id)
  if (!allowed) return null
  const cur = resolvePoProductLineStatus(allowed)
  if (cur === PO_PRODUCT_INVENTORY_STATUS.READY_FOR_DISPATCHMENT) {
    return await poProductRepository.findById(allowed._id).lean()
  }
  if (cur === PO_PRODUCT_INVENTORY_STATUS.DELIVERED) {
    return await poProductRepository.findById(allowed._id).lean()
  }
  if (cur !== PO_PRODUCT_INVENTORY_STATUS.INVENTORY_RECEIVED) {
    throw new CustomError(
      statusCodes.badRequest,
      'Mark as inventory received before marking ready for dispatchment',
      errorCodes.bad_request
    )
  }
  return await poProductRepository.findOneAndUpdate(
    { _id: allowed._id, isDeleted: false },
    {
      $set: { status: PO_PRODUCT_INVENTORY_STATUS.READY_FOR_DISPATCHMENT },
      $unset: { inventoryStatus: 1 },
    },
    { new: true }
  ).lean()
}
