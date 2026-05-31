import PurchaseTaskModel, {
  PURCHASE_TASK_STATUS,
  PURCHASE_TASK_TYPE,
  PURCHASE_TASK_PRIORITY,
} from '../../models/purchaseTask.model.js'
import QuotationModel from '../../models/quotation.model.js'
import EmployeeModel from '../../models/employee.model.js'
import ProductModel from '../../models/product.model.js'
import CategoryModel from '../../models/category.model.js'
import CustomError from '../../utils/exception.js'
import { statusCodes, errorCodes } from '../../core/common/constant.js'

const PURCHASE_ROLES = [
  'purchase_exicutive',
  'purchase_executive',
]

export const assignQuotationTask = async ({
  quotationId,
  assignedTo,
  assignedBy,
  type = PURCHASE_TASK_TYPE.QUOTATION,
  priority = PURCHASE_TASK_PRIORITY.HIGHEST,
  quotationNumber,
  product,
  productCategory,
  productGroup,
  subCategory,
  targetRate,
  procurementRate,
  dueDate,
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
      errorCodes.not_found
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
      errorCodes.not_found
    )
  }

  if (!PURCHASE_ROLES.includes(employee.role)) {
    throw new CustomError(
      statusCodes.badRequest,
      'Selected employee is not a purchase role',
      errorCodes.invalid_input
    )
  }

  const branchId =
    quotation.branchId || employee.branchId || branchIdFromRequest || null

  const doc = await PurchaseTaskModel.create({
    quotationId: quotation._id,
    assignedTo: employee._id,
    assignedBy: assignedBy || null,
    type: type || PURCHASE_TASK_TYPE.QUOTATION,
    priority: priority || PURCHASE_TASK_PRIORITY.HIGHEST,
    quotationNumber: quotationNumber || quotation.quotationCode || '',
    product: product && typeof product === 'object' ? product : {},
    productCategory: productCategory || '',
    productGroup: productGroup || '',
    subCategory: subCategory || '',
    targetRate: typeof targetRate === 'number' ? targetRate : 0,
    procurementRate:
      typeof procurementRate === 'number' ? procurementRate : null,
    dueDate: dueDate ? new Date(dueDate) : null,
    supplierRateRemark: supplierRateRemark || '',
    status: PURCHASE_TASK_STATUS.ASSIGNED,
    branchId,
  })

  return doc.toObject()
}

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Automatically assign purchase tasks for a quotation based on product categories
 * and employee category strings.
 *
 * - Matches employees in the same branch.
 * - Matches when employee.categories contains the category name (comma-separated list).
 * - Avoids duplicate tasks per employee per quotation.
 * - Swallows errors so quotation/query flows are never broken.
 */
export const autoAssignPurchaseTasksForQuotation = async ({
  quotation,
  branchId,
  assignedBy,
}) => {
  try {
    if (!quotation?._id) {
      return
    }

    const effectiveBranchId = branchId || quotation.branchId || null
    if (!effectiveBranchId) {
      return
    }

    const products = Array.isArray(quotation.products) ? quotation.products : []
    const productIds = [
      ...new Set(
        products
          .map((p) => {
            if (!p?.product_id) return null
            return typeof p.product_id === 'object'
              ? p.product_id._id || p.product_id.id
              : p.product_id
          })
          .filter(Boolean)
      ),
    ]

    if (!productIds.length) {
      return
    }

    const productDocs = await ProductModel.find({ _id: { $in: productIds } })
      .select('category')
      .populate('category', 'name')
      .lean()

    const categoryNames = [
      ...new Set(
        productDocs
          .map((pd) => pd?.category && (pd.category.name || '').trim())
          .filter((name) => typeof name === 'string' && name.trim().length > 0)
          .map((name) => name.trim())
      ),
    ]

    if (!categoryNames.length) {
      return
    }

    // Build OR conditions for category match in employee.categories
    const orConditions = categoryNames.map((name) => ({
      categories: {
        $regex: new RegExp(`(^|,\\s*)${escapeRegex(name)}(\\s*,|$)`, 'i'),
      },
    }))

    const matchingEmployees = await EmployeeModel.find({
      isDeleted: false,
      branchId: effectiveBranchId,
      categories: { $ne: null, $ne: '' },
      ...(orConditions.length ? { $or: orConditions } : {}),
    })
      .select('_id categories branchId')
      .lean()

    if (!matchingEmployees.length) {
      // Fallback: leave unassigned (no tasks created) – do not alter existing assignment flow
      return
    }

    const existingTasks = await PurchaseTaskModel.find({
      isDeleted: false,
      quotationId: quotation._id,
    })
      .select('assignedTo')
      .lean()

    const alreadyAssigned = new Set(
      existingTasks.map((t) => String(t.assignedTo)).filter(Boolean)
    )

    const categoryLabel = categoryNames.join(', ')

    const docsToCreate = []
    for (const emp of matchingEmployees) {
      const empId = String(emp._id)
      if (alreadyAssigned.has(empId)) {
        continue
      }

      docsToCreate.push({
        quotationId: quotation._id,
        assignedTo: emp._id,
        assignedBy: assignedBy || quotation.created_by || null,
        type: PURCHASE_TASK_TYPE.QUOTATION,
        priority: PURCHASE_TASK_PRIORITY.HIGHEST,
        quotationNumber: quotation.quotationCode || '',
        product: {},
        productCategory: categoryLabel,
        productGroup: '',
        subCategory: '',
        targetRate: 0,
        procurementRate: null,
        dueDate: null,
        supplierRateRemark: '',
        status: PURCHASE_TASK_STATUS.ASSIGNED,
        branchId: effectiveBranchId,
      })
    }

    if (!docsToCreate.length) {
      return
    }

    await PurchaseTaskModel.insertMany(docsToCreate)
  } catch {
    // Never block query/quotation flows because of auto-assignment issues
  }
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

const paginateQuery = async ({
  model,
  filter,
  pageNumber,
  pageSize,
  sort = { createdAt: -1 },
}) => {
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
      errorCodes.unauthorized
    )
  }

  const filter = buildBaseTaskFilter({ status, branchFilter })

  if (!isFullAccessRole) {
    filter.assignedTo = currentUserId
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
      errorCodes.not_found
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
    { new: true, runValidators: true }
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
      errorCodes.not_found
    )
  }

  const updated = await PurchaseTaskModel.findByIdAndUpdate(
    taskId,
    {
      $set: {
        supplierRateRemark: supplierRateRemark || '',
      },
    },
    { new: true, runValidators: true }
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
