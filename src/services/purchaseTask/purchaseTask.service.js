import PurchaseTaskModel, {
  PURCHASE_TASK_STATUS,
} from '../../models/purchaseTask.model.js'
import QuotationModel from '../../models/quotation.model.js'
import EmployeeModel from '../../models/employee.model.js'
import CustomError from '../../utils/exception.js'
import { statusCodes, errorCodes } from '../../core/common/constant.js'

const PURCHASE_ROLES = ['purchase_manager', 'purchase_exicutive', 'purchase_executive']

export const assignQuotationTask = async ({
  quotationId,
  assignedTo,
  assignedBy,
  productCategory,
  productGroup,
  subCategory,
  targetRate,
  supplierRateRemark,
  branchIdFromRequest = null,
}) => {
  const quotation = await QuotationModel.findOne({
    _id: quotationId,
    isDeleted: false,
  }).lean()

  if (!quotation) {
    throw new CustomError(
      statusCodes.notFound,
      'Quotation not found',
      errorCodes.not_found,
    )
  }

  const employee = await EmployeeModel.findOne({
    _id: assignedTo,
    isDeleted: false,
  }).lean()

  if (!employee) {
    throw new CustomError(
      statusCodes.notFound,
      'Employee not found',
      errorCodes.not_found,
    )
  }

  if (!PURCHASE_ROLES.includes(employee.role)) {
    throw new CustomError(
      statusCodes.badRequest,
      'Selected employee is not a purchase role',
      errorCodes.invalid_input,
    )
  }

  const branchId = quotation.branchId || employee.branchId || branchIdFromRequest || null

  const doc = await PurchaseTaskModel.create({
    quotationId: quotation._id,
    assignedTo: employee._id,
    assignedBy: assignedBy || null,
    productCategory: productCategory || '',
    productGroup: productGroup || '',
    subCategory: subCategory || '',
    targetRate: typeof targetRate === 'number' ? targetRate : null,
    supplierRateRemark: supplierRateRemark || '',
    status: PURCHASE_TASK_STATUS.PENDING,
    branchId,
  })

  return doc.toObject()
}

const buildBaseTaskFilter = ({ status, branchFilter = {} }) => {
  const filter = {
    isDeleted: false,
    ...branchFilter,
  }

  if (status && typeof status === 'string' && status.trim()) {
    filter.status = status.trim()
  }

  return filter
}

const paginateQuery = async ({ model, filter, pageNumber, pageSize, sort = { createdAt: -1 } }) => {
  const page = Math.max(1, parseInt(pageNumber, 10) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 10))
  const skip = (page - 1) * limit

  const totalItems = await model.countDocuments(filter)

  const tasks = await model
    .find(filter)
    .populate('quotationId', 'quotationCode companyInfo status products')
    .populate('assignedTo', 'name email phone role designation branchId')
    .populate('assignedBy', 'name email phone role designation')
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean()

  const totalPages = Math.ceil(totalItems / limit) || 1

  return {
    tasks,
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

export const listPurchaseTasksForUser = async ({
  pageNumber = 1,
  pageSize = 10,
  status = '',
  branchFilter = {},
  currentUserId = null,
  role = null,
  isFullAccessRole = false,
}) => {
  if (!currentUserId) {
    throw new CustomError(
      statusCodes.unauthorized,
      'User context is required',
      errorCodes.unauthorized,
    )
  }

  const filter = buildBaseTaskFilter({ status, branchFilter })

  if (!isFullAccessRole) {
    if (role === 'purchase_manager') {
      // Manager: see all tasks in branch (branchFilter already applied)
    } else if (role === 'purchase_exicutive' || role === 'purchase_executive') {
      filter.assignedTo = currentUserId
    } else {
      // Other roles: restrict to tasks assigned to them
      filter.assignedTo = currentUserId
    }
  }

  return paginateQuery({
    model: PurchaseTaskModel,
    filter,
    pageNumber,
    pageSize,
  })
}

export const updatePurchaseTaskStatus = async ({
  taskId,
  status,
  targetRate,
  branchFilter = {},
}) => {
  const existing = await PurchaseTaskModel.findOne({
    _id: taskId,
    isDeleted: false,
    ...branchFilter,
  }).lean()

  if (!existing) {
    throw new CustomError(
      statusCodes.notFound,
      'Task not found',
      errorCodes.not_found,
    )
  }

  const updatePayload = {
    status,
  }

  if (typeof targetRate === 'number') {
    updatePayload.targetRate = targetRate
  }

  const updated = await PurchaseTaskModel.findByIdAndUpdate(
    taskId,
    { $set: updatePayload },
    { new: true, runValidators: true },
  )
    .populate('quotationId', 'quotationCode companyInfo status products')
    .populate('assignedTo', 'name email phone role designation branchId')
    .populate('assignedBy', 'name email phone role designation')
    .lean()

  return updated
}

export const updatePurchaseTaskRemark = async ({
  taskId,
  supplierRateRemark,
  branchFilter = {},
}) => {
  const existing = await PurchaseTaskModel.findOne({
    _id: taskId,
    isDeleted: false,
    ...branchFilter,
  }).lean()

  if (!existing) {
    throw new CustomError(
      statusCodes.notFound,
      'Task not found',
      errorCodes.not_found,
    )
  }

  const updated = await PurchaseTaskModel.findByIdAndUpdate(
    taskId,
    {
      $set: {
        supplierRateRemark: supplierRateRemark || '',
      },
    },
    { new: true, runValidators: true },
  )
    .populate('quotationId', 'quotationCode companyInfo status products')
    .populate('assignedTo', 'name email phone role designation branchId')
    .populate('assignedBy', 'name email phone role designation')
    .lean()

  return updated
}

export const getRateBucketData = async (options) => {
  // For now, rate bucket view is built directly from tasks plus their rate/remark/status.
  // This reuses the same query logic so we don't duplicate filters or pagination.
  return listPurchaseTasksForUser(options)
}

export const adminListPurchaseTasks = async ({
  pageNumber = 1,
  pageSize = 10,
  status = '',
  branchFilter = {},
  employeeId = null,
  role = null,
}) => {
  const filter = buildBaseTaskFilter({ status, branchFilter })

  if (employeeId) {
    filter.assignedTo = employeeId
  }

  if (role) {
    const employees = await EmployeeModel.find({
      isDeleted: false,
      role,
    })
      .select('_id')
      .lean()

    const ids = (employees || []).map((e) => e._id)
    if (ids.length === 0) {
      // No employees for this role -> empty result
      return paginateQuery({
        model: PurchaseTaskModel,
        filter: { _id: { $in: [] } },
        pageNumber,
        pageSize,
      })
    }

    filter.assignedTo = { $in: ids }
  }

  return paginateQuery({
    model: PurchaseTaskModel,
    filter,
    pageNumber,
    pageSize,
  })
}

