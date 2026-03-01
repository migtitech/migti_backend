import {
  Message,
  statusCodes,
  BRANCH_BYPASS_ROLES,
} from '../../core/common/constant.js'
import { getBranchFilter } from '../../core/helpers/branchFilter.js'
import {
  assignPurchaseTaskSchema,
  listMyPurchaseTasksSchema,
  updatePurchaseTaskStatusSchema,
  updatePurchaseTaskRemarkSchema,
  listRateBucketSchema,
  adminListPurchaseTasksSchema,
} from '../../validator/purchaseTask/purchaseTask.validator.js'
import {
  assignQuotationTask,
  listPurchaseTasksForUser,
  updatePurchaseTaskStatus,
  updatePurchaseTaskRemark,
  getRateBucketData,
  adminListPurchaseTasks,
} from '../../services/purchaseTask/purchaseTask.service.js'

export const assignPurchaseTaskController = async (req, res) => {
  const { error, value } = assignPurchaseTaskSchema.validate(req.body, {
    abortEarly: false,
  })

  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const currentUserId = req.user?.id || req.user?._id
  const branchIdFromRequest = req.user?.branchId || null

  const result = await assignQuotationTask({
    ...value,
    assignedBy: currentUserId || null,
    branchIdFromRequest,
  })

  return res.status(statusCodes.created).json({
    success: true,
    message: 'Quotation assigned as purchase task successfully',
    data: result,
  })
}

export const listMyPurchaseTasksController = async (req, res) => {
  const { error, value } = listMyPurchaseTasksSchema.validate(req.query, {
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
  const currentUserId = req.user?.id || req.user?._id
  const role = req.user?.role || null
  const isFullAccessRole = role && BRANCH_BYPASS_ROLES.includes(role)

  const result = await listPurchaseTasksForUser({
    ...value,
    branchFilter,
    currentUserId: currentUserId || null,
    role,
    isFullAccessRole: !!isFullAccessRole,
  })

  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Purchase tasks retrieved successfully',
    data: result,
  })
}

export const updatePurchaseTaskStatusController = async (req, res) => {
  const { error, value } = updatePurchaseTaskStatusSchema.validate(
    { ...req.body, ...req.query },
    { abortEarly: false },
  )

  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const branchFilter = getBranchFilter(req)
  const result = await updatePurchaseTaskStatus({
    ...value,
    branchFilter,
  })

  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Purchase task status updated successfully',
    data: result,
  })
}

export const updatePurchaseTaskRemarkController = async (req, res) => {
  const { error, value } = updatePurchaseTaskRemarkSchema.validate(
    { ...req.body, ...req.query },
    { abortEarly: false },
  )

  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const branchFilter = getBranchFilter(req)
  const result = await updatePurchaseTaskRemark({
    ...value,
    branchFilter,
  })

  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Supplier rate remark updated successfully',
    data: result,
  })
}

export const listRateBucketController = async (req, res) => {
  const { error, value } = listRateBucketSchema.validate(req.query, {
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
  const currentUserId = req.user?.id || req.user?._id
  const role = req.user?.role || null
  const isFullAccessRole = role && BRANCH_BYPASS_ROLES.includes(role)

  const result = await getRateBucketData({
    ...value,
    branchFilter,
    currentUserId: currentUserId || null,
    role,
    isFullAccessRole: !!isFullAccessRole,
  })

  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Rate bucket data retrieved successfully',
    data: result,
  })
}

export const adminListPurchaseTasksController = async (req, res) => {
  const { error, value } = adminListPurchaseTasksSchema.validate(req.query, {
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

  const result = await adminListPurchaseTasks({
    ...value,
    branchFilter,
  })

  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Purchase tasks (admin view) retrieved successfully',
    data: result,
  })
}

