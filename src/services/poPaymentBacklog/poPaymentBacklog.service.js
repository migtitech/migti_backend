import PoPaymentBacklogModel from '../../models/poPaymentBacklog.model.js'
import EmployeeModel from '../../models/employee.model.js'
import CustomError from '../../utils/exception.js'
import { statusCodes, errorCodes } from '../../core/common/constant.js'

/** Create a backlog entry when HOD approves a PO. Idempotent — won't duplicate. */
export const createPoPaymentBacklogEntry = async ({
  purchaseOrder,
  amount,
  clients_snapshot = null,
}) => {
  const purchaseOrderId = purchaseOrder?._id
  if (!purchaseOrderId) return null

  const existing = await PoPaymentBacklogModel.findOne({
    purchaseOrderId,
    isDeleted: false,
  }).lean()
  if (existing) return existing

  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + 35)

  const entry = await PoPaymentBacklogModel.create({
    purchaseOrderId,
    po_snapshot: purchaseOrder,
    branchId: purchaseOrder.branchId || null,
    amount: Number(amount) || 0,
    employeeId: purchaseOrder.salesEmployeeId || null,
    clients_snapshot,
    due_date: dueDate,
    is_settled: false,
  })

  return entry
}

/** List backlog entries — optionally filtered by employeeId, is_settled, poNumber, salesPersonName, clientName, dateFrom, dateTo. */
export const listPoPaymentBacklog = async ({
  employeeId,
  is_settled,
  poNumber,
  salesPersonName,
  clientName,
  dateFrom,
  dateTo,
  pageNumber = 1,
  pageSize = 20,
} = {}) => {
  const filter = { isDeleted: false }

  if (employeeId) filter.employeeId = employeeId

  if (typeof is_settled === 'boolean') {
    filter.is_settled = is_settled
  } else if (is_settled === 'true') {
    filter.is_settled = true
  } else if (is_settled === 'false') {
    filter.is_settled = false
  }

  if (poNumber) {
    filter['po_snapshot.poCode'] = { $regex: poNumber, $options: 'i' }
  }

  if (clientName) {
    filter['clients_snapshot.name'] = { $regex: clientName, $options: 'i' }
  }

  if (dateFrom || dateTo) {
    filter.createdAt = {}
    if (dateFrom) filter.createdAt.$gte = new Date(dateFrom)
    if (dateTo) {
      const endDate = new Date(dateTo)
      endDate.setHours(23, 59, 59, 999)
      filter.createdAt.$lte = endDate
    }
  }

  if (salesPersonName) {
    const matchingEmployees = await EmployeeModel.find({
      name: { $regex: salesPersonName, $options: 'i' },
      isDeleted: false,
    })
      .select('_id')
      .lean()
    const empIds = matchingEmployees.map((e) => e._id)
    filter.employeeId = empIds.length > 0 ? { $in: empIds } : { $in: [] }
  }

  const skip = (Number(pageNumber) - 1) * Number(pageSize)
  const [items, total] = await Promise.all([
    PoPaymentBacklogModel.find(filter)
      .sort({ due_date: 1, createdAt: -1 })
      .skip(skip)
      .limit(Number(pageSize))
      .populate('employeeId', 'name email phone role')
      .populate('branchId', 'branchName branchCode')
      .lean(),
    PoPaymentBacklogModel.countDocuments(filter),
  ])

  const totalAmount = await PoPaymentBacklogModel.aggregate([
    { $match: { ...filter, isDeleted: { $ne: true } } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ])

  // Global analytics — always computed on all unsettled entries (ignores active filters)
  const globalPendingFilter = { isDeleted: false, is_settled: false }
  const [globalAmountAgg, globalCompaniesAgg] = await Promise.all([
    PoPaymentBacklogModel.aggregate([
      { $match: globalPendingFilter },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    PoPaymentBacklogModel.aggregate([
      { $match: globalPendingFilter },
      { $group: { _id: '$clients_snapshot.name' } },
      { $count: 'total' },
    ]),
  ])

  return {
    items,
    pagination: {
      currentPage: Number(pageNumber),
      pageSize: Number(pageSize),
      totalItems: total,
      totalPages: Math.ceil(total / Number(pageSize)),
    },
    summary: {
      totalCount: total,
      totalAmount: totalAmount[0]?.total || 0,
    },
    analytics: {
      totalPendingAmount: globalAmountAgg[0]?.total || 0,
      totalCompaniesWithPending: globalCompaniesAgg[0]?.total || 0,
    },
  }
}

/** Mark a backlog entry as settled (is_settled = true). */
export const settlePoPaymentBacklog = async ({ backlogId }) => {
  const entry = await PoPaymentBacklogModel.findOne({
    _id: backlogId,
    isDeleted: false,
  })

  if (!entry) {
    throw new CustomError(
      statusCodes.notFound,
      'Backlog entry not found',
      errorCodes.not_found
    )
  }

  if (entry.is_settled) return entry.toObject()

  entry.is_settled = true
  await entry.save()

  return entry.toObject()
}
