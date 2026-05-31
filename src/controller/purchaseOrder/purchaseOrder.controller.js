import { Message, statusCodes } from '../../core/common/constant.js'
import { BRANCH_BYPASS_ROLES } from '../../core/common/constant.js'
import { getBranchFilter } from '../../core/helpers/branchFilter.js'
import {
  listPurchaseOrderSchema,
  listMyAssignedPurchaseOrderSchema,
  getPurchaseOrderByIdSchema,
  listPoProductLinesSchema,
  getPurchaseOrderByQuotationIdSchema,
  createPurchaseOrderFromQuotationSchema,
  updatePurchaseOrderSchema,
  updatePurchaseOrderStatusSchema,
  appendPurchaseOrderPaymentSchema,
  closePurchaseOrderAsHodSchema,
  approvePurchaseOrderAsHodSchema,
} from '../../validator/purchaseOrder/purchaseOrder.validator.js'
import {
  listPurchaseOrders,
  listMyAssignedPurchaseOrders,
  getPurchaseOrderById,
  listPoProductLinesForPurchaseOrder,
  getPurchaseOrderByQuotationId,
  createPurchaseOrderFromQuotation,
  updatePurchaseOrder,
  updatePurchaseOrderStatus,
  appendPurchaseOrderPayment,
  closePurchaseOrderAsHod,
  approvePurchaseOrderAsHod,
} from '../../services/purchaseOrder/purchaseOrder.service.js'

const normalizeRole = (role) =>
  String(role || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')

const PO_BUCKET_HOD_ROLES = new Set(['head_of_department', 'hod'])
const HEAD_OF_DEPARTMENT_ROLE = 'head_of_department'
const isBackOfficeRole = (role) => {
  const normalized = normalizeRole(role)
  if (
    ['back_office_exicutive', 'back_office_executive', 'boe'].includes(
      normalized
    )
  )
    return true
  return normalized.replace(/_/g, '').includes('backoffice')
}
const hasOwnershipBypass = (role) => {
  const normalized = normalizeRole(role)
  if (BRANCH_BYPASS_ROLES.includes(normalized)) return true
  return isBackOfficeRole(normalized)
}
const resolvePoBranchFilter = (req, options = {}) => {
  if (isBackOfficeRole(req?.user?.role)) return {}
  return getBranchFilter(req, options)
}

export const listPurchaseOrdersController = async (req, res) => {
  const { error, value } = listPurchaseOrderSchema.validate(req.query, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const branchFilter = resolvePoBranchFilter(req, { allowQueryBranchId: true })
  const currentUserId = req.user?.id || req.user?._id
  const isFullAccessRole = hasOwnershipBypass(req.user?.role)
  const result = await listPurchaseOrders({
    ...value,
    branchFilter,
    currentUserId: currentUserId || null,
    isFullAccessRole: !!isFullAccessRole,
  })
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Purchase orders retrieved successfully',
    data: result,
  })
}

/** POs where `salesEmployeeId` is the logged-in employee; includes PO payment ledger summary. */
export const listMyAssignedPurchaseOrdersController = async (req, res) => {
  const { error, value } = listMyAssignedPurchaseOrderSchema.validate(
    req.query,
    { abortEarly: false }
  )
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const employeeId = req.user?.id || req.user?._id
  if (!employeeId) {
    return res.status(statusCodes.unauthorized).json({
      success: false,
      message: 'Authentication required',
    })
  }

  const userRole = normalizeRole(req.user?.role)
  if (!String(userRole).toLowerCase().startsWith('sales')) {
    return res.status(statusCodes.forbidden).json({
      success: false,
      message: 'This endpoint is only available to sales roles',
    })
  }

  const branchFilter = resolvePoBranchFilter(req, { allowQueryBranchId: true })
  const result = await listMyAssignedPurchaseOrders({
    ...value,
    employeeId,
    branchFilter,
  })
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Assigned purchase orders retrieved successfully',
    data: result,
  })
}

export const getPurchaseOrderByIdController = async (req, res) => {
  const { error, value } = getPurchaseOrderByIdSchema.validate(req.query, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const branchFilter = resolvePoBranchFilter(req)
  const currentUserId = req.user?.id || req.user?._id
  const isFullAccessRole = hasOwnershipBypass(req.user?.role)
  const result = await getPurchaseOrderById({
    ...value,
    branchFilter,
    currentUserId: currentUserId || null,
    isFullAccessRole: !!isFullAccessRole,
  })
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Purchase order retrieved successfully',
    data: result,
  })
}

export const listPoProductLinesController = async (req, res) => {
  const { error, value } = listPoProductLinesSchema.validate(req.query, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }
  const branchFilter = resolvePoBranchFilter(req)
  const currentUserId = req.user?.id || req.user?._id
  const isFullAccessRole = hasOwnershipBypass(req.user?.role)
  const result = await listPoProductLinesForPurchaseOrder({
    ...value,
    branchFilter,
    currentUserId: currentUserId || null,
    isFullAccessRole: !!isFullAccessRole,
  })
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'PO product lines retrieved successfully',
    data: result,
  })
}

export const getPurchaseOrderByQuotationIdController = async (req, res) => {
  const { error, value } = getPurchaseOrderByQuotationIdSchema.validate(
    req.query,
    {
      abortEarly: false,
    }
  )
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const branchFilter = resolvePoBranchFilter(req)
  const currentUserId = req.user?.id || req.user?._id
  const isFullAccessRole = hasOwnershipBypass(req.user?.role)
  const result = await getPurchaseOrderByQuotationId({
    ...value,
    branchFilter,
    currentUserId: currentUserId || null,
    isFullAccessRole: !!isFullAccessRole,
  })
  return res.status(statusCodes.ok).json({
    success: true,
    message: result
      ? 'Purchase order found'
      : 'No purchase order for this quotation',
    data: result,
  })
}

export const createPurchaseOrderFromQuotationController = async (req, res) => {
  const { error, value } = createPurchaseOrderFromQuotationSchema.validate(
    req.body,
    {
      abortEarly: false,
    }
  )
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const branchFilter = resolvePoBranchFilter(req)
  const currentUserId = req.user?.id || req.user?._id
  const isFullAccessRole = hasOwnershipBypass(req.user?.role)
  const result = await createPurchaseOrderFromQuotation({
    quotationId: value.quotationId,
    reuseExisting: value.reuseExisting,
    branchFilter,
    currentUserId: currentUserId || null,
    isFullAccessRole: !!isFullAccessRole,
    created_by: currentUserId || null,
    role: req.user?.role || '',
  })
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Purchase order ready',
    data: result,
  })
}

export const updatePurchaseOrderController = async (req, res) => {
  const { error, value } = updatePurchaseOrderSchema.validate(
    { ...req.body, ...req.query },
    { abortEarly: false }
  )
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const branchFilter = resolvePoBranchFilter(req)
  const currentUserId = req.user?.id || req.user?._id
  const isFullAccessRole = hasOwnershipBypass(req.user?.role)
  const { purchaseOrderId, ...rest } = value
  const result = await updatePurchaseOrder({
    purchaseOrderId,
    ...rest,
    branchFilter,
    currentUserId: currentUserId || null,
    isFullAccessRole: !!isFullAccessRole,
  })
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Purchase order updated successfully',
    data: result,
  })
}

export const appendPurchaseOrderPaymentController = async (req, res) => {
  const { error, value } = appendPurchaseOrderPaymentSchema.validate(
    { ...req.body, ...req.query },
    { abortEarly: false }
  )
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const branchFilter = resolvePoBranchFilter(req)
  const currentUserId = req.user?.id || req.user?._id
  const isFullAccessRole = hasOwnershipBypass(req.user?.role)
  const result = await appendPurchaseOrderPayment({
    purchaseOrderId: value.purchaseOrderId,
    amount: value.amount,
    paidAt: value.paidAt,
    remark: value.remark,
    branchFilter,
    currentUserId: currentUserId || null,
    isFullAccessRole: !!isFullAccessRole,
  })
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Payment recorded',
    data: result,
  })
}

export const updatePurchaseOrderStatusController = async (req, res) => {
  const { error, value } = updatePurchaseOrderStatusSchema.validate(
    { ...req.body, ...req.query },
    { abortEarly: false }
  )
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const branchFilter = resolvePoBranchFilter(req)
  const currentUserId = req.user?.id || req.user?._id
  const isFullAccessRole = hasOwnershipBypass(req.user?.role)
  const result = await updatePurchaseOrderStatus({
    ...value,
    branchFilter,
    currentUserId: currentUserId || null,
    isFullAccessRole: !!isFullAccessRole,
  })
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Purchase order status updated successfully',
    data: result,
  })
}

export const approvePurchaseOrderAsHodController = async (req, res) => {
  const role = normalizeRole(req.user?.role)
  if (role !== HEAD_OF_DEPARTMENT_ROLE) {
    return res.status(statusCodes.forbidden).json({
      success: false,
      message:
        'Only employees with the Head of Department role can approve purchase orders from the PO bucket',
    })
  }

  const { error, value } = approvePurchaseOrderAsHodSchema.validate(
    { ...req.body, ...req.query },
    { abortEarly: false }
  )
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const branchFilter = resolvePoBranchFilter(req)
  const result = await approvePurchaseOrderAsHod({
    purchaseOrderId: value.purchaseOrderId,
    branchFilter,
  })
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Purchase order marked HOD approved',
    data: result,
  })
}

export const closePurchaseOrderAsHodController = async (req, res) => {
  const role = normalizeRole(req.user?.role)
  if (!PO_BUCKET_HOD_ROLES.has(role)) {
    return res.status(statusCodes.forbidden).json({
      success: false,
      message:
        'Only Head of Department can close purchase orders from the PO bucket',
    })
  }

  const { error, value } = closePurchaseOrderAsHodSchema.validate(
    { ...req.body, ...req.query },
    { abortEarly: false }
  )
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const branchFilter = resolvePoBranchFilter(req)
  const result = await closePurchaseOrderAsHod({
    purchaseOrderId: value.purchaseOrderId,
    branchFilter,
  })
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Purchase order closed',
    data: result,
  })
}
