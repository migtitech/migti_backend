import mongoose from 'mongoose'
import { TASK_STATUS } from '../../models/taskManagement.model.js'
import CustomError from '../../utils/exception.js'
import { statusCodes, errorCodes } from '../../core/common/constant.js'
import {
  countTasks,
  createTask as createTaskDoc,
  findTaskById,
  findTaskByIdLean,
  findTaskByIdWithPopulates,
  findTaskByIdWithPopulatesAndPhone,
  findTasks,
  insertTasks,
} from '../../repository/taskManagement.repository.js'

export const createTask = async (payload) => {
  const {
    branchId: payloadBranchId,
    productInfo: rawProductInfo,
    ...rest
  } = payload
  const doc = {
    ...rest,
    status: rest.status || TASK_STATUS.DRAFT,
    productInfo: {
      name: rawProductInfo?.name ?? '',
      hsn: rawProductInfo?.hsn ?? '',
      gst: rawProductInfo?.gst ?? null,
      modelNumber: rawProductInfo?.modelNumber ?? '',
      description: rawProductInfo?.description ?? '',
      image: null,
    },
  }
  if (payloadBranchId && mongoose.Types.ObjectId.isValid(payloadBranchId)) {
    doc.branchId = new mongoose.Types.ObjectId(payloadBranchId)
  }
  if (rest.employeeId && mongoose.Types.ObjectId.isValid(rest.employeeId)) {
    doc.employeeId = new mongoose.Types.ObjectId(rest.employeeId)
    doc.assignedDate = new Date()
    doc.status = TASK_STATUS.ASSIGNED
  }
  if (
    rawProductInfo?.image &&
    mongoose.Types.ObjectId.isValid(rawProductInfo.image)
  ) {
    doc.productInfo.image = new mongoose.Types.ObjectId(rawProductInfo.image)
  }
  if (rest.dueDate) doc.dueDate = new Date(rest.dueDate)
  const task = await createTaskDoc(doc)
  return task.toObject()
}

/**
 * Create draft tasks for each product of a query.
 * Used when a new query is created.
 */
export const createDraftTasksForQueryProducts = async ({ query }) => {
  if (!query || !Array.isArray(query.products) || query.products.length === 0)
    return []

  const docs = []
  for (const p of query.products) {
    const product = p || {}
    docs.push({
      title: 'Add Rate',
      status: TASK_STATUS.DRAFT,
      branchId: query.branchId || null,
      productInfo: {
        name: product.productName || product.name || '',
        hsn: product.hsnNumber || product.hsn || '',
        gst:
          typeof product.gstPercentage === 'number'
            ? product.gstPercentage
            : typeof product.gst === 'number'
              ? product.gst
              : null,
        modelNumber: product.modelNumber || '',
        description: product.description || '',
        image:
          Array.isArray(product.images) && product.images[0]
            ? product.images[0]
            : null,
      },
      remark: (product.remark || '').toString(),
      targetRate: null,
      dueDate: null,
      priority: undefined,
    })
  }

  if (!docs.length) return []
  const created = await insertTasks(docs)
  return created.map((d) => d.toObject())
}

export const listTasks = async ({
  pageNumber = 1,
  pageSize = 10,
  status,
  search,
  branchFilter = {},
  employeeId,
}) => {
  const page = Math.max(1, parseInt(pageNumber))
  const limit = Math.min(100, Math.max(1, parseInt(pageSize)))
  const skip = (page - 1) * limit

  const filter = { isDeleted: false, ...branchFilter }
  if (employeeId && mongoose.Types.ObjectId.isValid(employeeId)) {
    filter.employeeId = new mongoose.Types.ObjectId(employeeId)
  }
  if (status && status !== '') filter.status = status
  if (search && search.trim()) {
    filter.$or = [
      { title: { $regex: search.trim(), $options: 'i' } },
      { 'productInfo.name': { $regex: search.trim(), $options: 'i' } },
    ]
  }

  const totalItems = await countTasks(filter)

  const tasks = await findTasks(filter, skip, limit)

  const totalPages = Math.ceil(totalItems / limit)
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

export const getTaskById = async (taskId, branchFilter = {}) => {
  if (!taskId || !mongoose.Types.ObjectId.isValid(taskId)) {
    throw new CustomError(
      statusCodes.badRequest,
      'Invalid task ID',
      errorCodes.invalid_input
    )
  }
  const filter = { _id: new mongoose.Types.ObjectId(taskId), ...branchFilter }
  const task = await findTaskByIdLean(filter)
  if (!task) {
    throw new CustomError(
      statusCodes.notFound,
      'Task not found',
      errorCodes.not_found
    )
  }
  return task
}

export const assignEmployeeToTask = async (
  taskId,
  employeeId,
  branchFilter = {}
) => {
  if (!taskId || !mongoose.Types.ObjectId.isValid(taskId)) {
    throw new CustomError(
      statusCodes.badRequest,
      'Invalid task ID',
      errorCodes.invalid_input
    )
  }
  if (!employeeId || !mongoose.Types.ObjectId.isValid(employeeId)) {
    throw new CustomError(
      statusCodes.badRequest,
      'Invalid employee ID',
      errorCodes.invalid_input
    )
  }
  const filter = { _id: new mongoose.Types.ObjectId(taskId), ...branchFilter }
  const task = await findTaskById(filter)
  if (!task) {
    throw new CustomError(
      statusCodes.notFound,
      'Task not found',
      errorCodes.not_found
    )
  }
  task.employeeId = new mongoose.Types.ObjectId(employeeId)
  task.assignedDate = new Date()
  task.status = TASK_STATUS.ASSIGNED
  await task.save()
  const updated = await findTaskByIdWithPopulates(task._id)
  return updated
}

export const updateTaskSupplierInfo = async ({
  taskId,
  payload,
  branchFilter = {},
  currentUserId,
}) => {
  if (!taskId || !mongoose.Types.ObjectId.isValid(taskId)) {
    throw new CustomError(
      statusCodes.badRequest,
      'Invalid task ID',
      errorCodes.invalid_input
    )
  }

  const filter = { _id: new mongoose.Types.ObjectId(taskId), ...branchFilter }
  const task = await findTaskById(filter)
  if (!task) {
    throw new CustomError(
      statusCodes.notFound,
      'Task not found',
      errorCodes.not_found
    )
  }

  const supplierInfo = task.supplierInfo || {}
  const {
    supplierId,
    supplierName,
    contactName,
    contactPhone,
    contactEmail,
    rate,
    currency,
    remark,
  } = payload

  if (supplierId && mongoose.Types.ObjectId.isValid(supplierId)) {
    supplierInfo.supplierId = new mongoose.Types.ObjectId(supplierId)
  } else if (supplierId === '' || supplierId === null) {
    supplierInfo.supplierId = null
  }

  if (supplierName !== undefined) supplierInfo.supplierName = supplierName || ''
  if (contactName !== undefined) supplierInfo.contactName = contactName || ''
  if (contactPhone !== undefined) supplierInfo.contactPhone = contactPhone || ''
  if (contactEmail !== undefined) supplierInfo.contactEmail = contactEmail || ''
  if (currency !== undefined) supplierInfo.currency = currency || 'INR'
  if (remark !== undefined) supplierInfo.remark = remark || ''
  if (rate !== undefined)
    supplierInfo.rate = rate === null ? null : Number(rate)

  supplierInfo.updatedBy =
    currentUserId && mongoose.Types.ObjectId.isValid(currentUserId)
      ? new mongoose.Types.ObjectId(currentUserId)
      : supplierInfo.updatedBy || null
  supplierInfo.updatedAt = new Date()

  task.supplierInfo = supplierInfo

  // If a rate is provided, consider task submitted
  if (supplierInfo.rate != null && Number.isFinite(Number(supplierInfo.rate))) {
    task.status = TASK_STATUS.SUBMITTED
    task.submissionDate = new Date()
  }

  await task.save()

  const updated = await findTaskByIdWithPopulatesAndPhone(task._id)

  return updated
}

export const updateTaskInfo = async ({
  taskId,
  payload,
  branchFilter = {},
}) => {
  if (!taskId || !mongoose.Types.ObjectId.isValid(taskId)) {
    throw new CustomError(
      statusCodes.badRequest,
      'Invalid task ID',
      errorCodes.invalid_input
    )
  }

  const filter = { _id: new mongoose.Types.ObjectId(taskId), ...branchFilter }
  const task = await findTaskById(filter)
  if (!task) {
    throw new CustomError(
      statusCodes.notFound,
      'Task not found',
      errorCodes.not_found
    )
  }

  const { title, productInfo, remark, targetRate, dueDate, priority } = payload

  if (title !== undefined) task.title = title
  if (remark !== undefined) task.remark = remark || ''
  if (targetRate !== undefined) {
    task.targetRate = targetRate === null ? null : Number(targetRate)
  }
  if (dueDate !== undefined) {
    task.dueDate = dueDate ? new Date(dueDate) : null
  }
  if (priority !== undefined) task.priority = priority

  if (productInfo && typeof productInfo === 'object') {
    task.productInfo = {
      ...task.productInfo,
      ...productInfo,
    }
  }

  await task.save()

  const updated = await findTaskByIdWithPopulatesAndPhone(task._id)

  return updated
}

export const deleteTask = async ({ taskId, branchFilter = {} }) => {
  if (!taskId || !mongoose.Types.ObjectId.isValid(taskId)) {
    throw new CustomError(
      statusCodes.badRequest,
      'Invalid task ID',
      errorCodes.invalid_input
    )
  }
  const filter = { _id: new mongoose.Types.ObjectId(taskId), ...branchFilter }
  const task = await findTaskById(filter)
  if (!task) {
    throw new CustomError(
      statusCodes.notFound,
      'Task not found',
      errorCodes.not_found
    )
  }
  await task.softDelete()
  return { success: true }
}
