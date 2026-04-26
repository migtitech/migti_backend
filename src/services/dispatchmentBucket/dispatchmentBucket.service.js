import mongoose from 'mongoose'
import PoProductModel from '../../models/poProduct.model.js'
import EmployeeModel from '../../models/employee.model.js'
import {
  FULL_ACCESS_ROLES,
  statusCodes,
  errorCodes,
} from '../../core/common/constant.js'
import CustomError from '../../utils/exception.js'
import {
  buildBaseStages,
  assertEmployeeCanAccessPoProduct,
} from '../purchaseBucket/purchaseBucket.service.js'
import {
  PO_PRODUCT_INVENTORY_STATUS,
  resolvePoProductLineStatus,
} from '../../models/poProduct.model.js'

const OBJECT_ID_REGEX = /^[a-fA-F0-9]{24}$/

const toOid = (v) => {
  if (v == null || v === '') return null
  if (!OBJECT_ID_REGEX.test(String(v))) return null
  return new mongoose.Types.ObjectId(String(v))
}

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const isFullAccess = (role) => {
  if (!role) return false
  return FULL_ACCESS_ROLES.map(String).includes(String(role))
}

const DISPATCH_LINE_STATUSES = [
  PO_PRODUCT_INVENTORY_STATUS.INVENTORY_RECEIVED,
  PO_PRODUCT_INVENTORY_STATUS.READY_FOR_DISPATCHMENT,
]

/**
 * PO product lines in the dispatch queue: `inventory_received` or `ready_for_dispatchment` only.
 */
export const listDispatchmentQueuePoProducts = async (q, user) => {
  const employee = await EmployeeModel.findById(user?.id)
    .select('assigned_groups role branchId')
    .lean()
  if (!employee) {
    return { data: [], total: 0, page: 1, pageSize: 20 }
  }

  const fullAccess = isFullAccess(employee.role)
  const page = Math.max(
    1,
    parseInt(String(q.page || q.pageNumber || 1), 10) || 1
  )
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(String(q.pageSize || q.limit || 20), 10) || 20)
  )
  const { search, from, to } = q
  const branchId = user?.branchId

  const assignedGroupIds = (employee.assigned_groups || [])
    .map((g) => toOid(g))
    .filter((id) => id != null)

  const base = buildBaseStages({
    assignedGroupIds,
    fullAccess,
    branchId,
  })
  if (!base) {
    return { data: [], total: 0, page, pageSize }
  }

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
 * Mark line delivered (from `ready_for_dispatchment` only). Updates `po_products.status`.
 */
export const markPoProductDelivered = async (id, user) => {
  const allowed = await assertEmployeeCanAccessPoProduct(id, user)
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
  return await PoProductModel.findOneAndUpdate(
    { _id: allowed._id, isDeleted: false },
    {
      $set: { status: PO_PRODUCT_INVENTORY_STATUS.DELIVERED },
      $unset: { inventoryStatus: 1 },
    },
    { new: true }
  ).lean()
}
