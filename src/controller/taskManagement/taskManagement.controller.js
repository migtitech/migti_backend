import { Message, statusCodes } from '../../core/common/constant.js'
import {
  getBranchFilter,
  getEffectiveBranchIdForCreate,
} from '../../core/helpers/branchFilter.js'
import {
  createTaskSchema,
  listTasksSchema,
  listMyTasksSchema,
  getTaskByIdSchema,
  assignEmployeeSchema,
  updateTaskSupplierSchema,
  updateTaskSchema,
} from '../../validator/taskManagement/taskManagement.validator.js'
import {
  createTask,
  listTasks,
  getTaskById,
  assignEmployeeToTask,
  updateTaskSupplierInfo,
  updateTaskInfo,
  deleteTask,
} from '../../services/taskManagement/taskManagement.service.js'
import { notifyEmployeesByBranchRoles } from '../../services/notification/notification.service.js'

export const createTaskController = async (req, res) => {
  const { error, value } = createTaskSchema.validate(req.body, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }
  const branchId = getEffectiveBranchIdForCreate(req, value.branchId)
  const result = await createTask({ ...value, branchId })
  return res.status(statusCodes.created).json({
    success: true,
    message: 'Task created successfully',
    data: result,
  })
}

export const listTasksController = async (req, res) => {
  const { error, value } = listTasksSchema.validate(req.query, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }
  const branchFilter = getBranchFilter(req, { allowQueryBranchId: true })
  const result = await listTasks({ ...value, branchFilter })
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Tasks retrieved successfully',
    data: result,
  })
}

export const listMyTasksController = async (req, res) => {
  const { error, value } = listMyTasksSchema.validate(req.query, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }
  const branchFilter = getBranchFilter(req)
  const currentUserId = req.user?.id || req.user?._id
  const result = await listTasks({
    ...value,
    branchFilter,
    employeeId: currentUserId || null,
  })
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'My tasks retrieved successfully',
    data: result,
  })
}

export const getTaskByIdController = async (req, res) => {
  const { error, value } = getTaskByIdSchema.validate(
    { taskId: req.params?.id || req.query?.taskId },
    { abortEarly: false }
  )
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }
  const branchFilter = getBranchFilter(req)
  const result = await getTaskById(value.taskId, branchFilter)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Task retrieved successfully',
    data: result,
  })
}

export const assignEmployeeController = async (req, res) => {
  const { error, value } = assignEmployeeSchema.validate(
    { ...req.body, taskId: req.body?.taskId || req.params?.id },
    { abortEarly: false }
  )
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }
  const branchFilter = getBranchFilter(req)
  const result = await assignEmployeeToTask(
    value.taskId,
    value.employeeId,
    branchFilter
  )
  const io = req.app.get('io')
  if (io && result) {
    const assignedToId =
      result.employeeId?._id?.toString() ||
      result.employeeId?.toString() ||
      String(value.employeeId)
    if (assignedToId) {
      io.to(`user:${assignedToId}`).emit('task:assigned', {
        taskId: result._id,
        title: result.title,
        assignedAt: result.assignedDate,
      })
    }
    const branchRef = result.branchId
    const branchIdForNotify =
      branchRef && typeof branchRef === 'object' && branchRef._id
        ? branchRef._id
        : branchRef
    if (branchIdForNotify) {
      const assigneeName =
        result.employeeId && typeof result.employeeId === 'object'
          ? result.employeeId.name || 'Employee'
          : 'Employee'
      try {
        await notifyEmployeesByBranchRoles({
          branchId: branchIdForNotify,
          roles: ['head_of_department'],
          title: 'Task assigned',
          description: `${assigneeName} was assigned to "${result.title || 'Task'}".`,
          io,
          metadata: {
            eventType: 'task_assigned',
            taskId: String(result._id),
          },
        })
      } catch {
        // Do not fail assign if notification persistence fails
      }
    }
  }
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Employee assigned to task successfully',
    data: result,
  })
}

export const updateTaskSupplierController = async (req, res) => {
  const { error, value } = updateTaskSupplierSchema.validate(
    { ...req.body, taskId: req.body?.taskId || req.params?.id },
    { abortEarly: false }
  )
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const branchFilter = getBranchFilter(req)
  const currentUserId = req.user?.id || req.user?._id

  const result = await updateTaskSupplierInfo({
    taskId: value.taskId,
    payload: value,
    branchFilter,
    currentUserId: currentUserId || null,
  })

  const io = req.app.get('io')
  if (io && result) {
    const assignedToId =
      result.employeeId?._id?.toString() ||
      result.employeeId?.toString() ||
      null
    const payload = {
      taskId: result._id,
      title: result.title,
      productName: result.productInfo?.name || '',
      rate: result.supplierInfo?.rate ?? null,
    }
    if (assignedToId) {
      io.to(`user:${assignedToId}`).emit('task:rateUpdated', payload)
    } else {
      io.emit('task:rateUpdated', payload)
    }
  }

  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Task supplier details updated successfully',
    data: result,
  })
}

export const updateTaskController = async (req, res) => {
  const { error, value } = updateTaskSchema.validate(
    { ...req.body, taskId: req.body?.taskId || req.params?.id },
    { abortEarly: false }
  )
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const branchFilter = getBranchFilter(req)
  const result = await updateTaskInfo({
    taskId: value.taskId,
    payload: value,
    branchFilter,
  })

  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Task updated successfully',
    data: result,
  })
}

export const deleteTaskController = async (req, res) => {
  const taskId = req.query?.taskId || req.body?.taskId || req.params?.id
  if (!taskId) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: ['taskId is required'],
    })
  }

  const branchFilter = getBranchFilter(req)
  await deleteTask({ taskId, branchFilter })

  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Task deleted successfully',
    data: {},
  })
}
