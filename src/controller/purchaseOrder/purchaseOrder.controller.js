import { Message, statusCodes } from '../../core/common/constant.js'
import { BRANCH_BYPASS_ROLES } from '../../core/common/constant.js'
import { getBranchFilter } from '../../core/helpers/branchFilter.js'
import {
  listPurchaseOrderSchema,
  getPurchaseOrderByIdSchema,
  getPurchaseOrderByQuotationIdSchema,
  createPurchaseOrderFromQuotationSchema,
  updatePurchaseOrderSchema,
  updatePurchaseOrderStatusSchema,
  appendPurchaseOrderPaymentSchema,
} from '../../validator/purchaseOrder/purchaseOrder.validator.js'
import {
  listPurchaseOrders,
  getPurchaseOrderById,
  getPurchaseOrderByQuotationId,
  createPurchaseOrderFromQuotation,
  updatePurchaseOrder,
  updatePurchaseOrderStatus,
  appendPurchaseOrderPayment,
} from '../../services/purchaseOrder/purchaseOrder.service.js'

const normalizeRole = (role) =>
  String(role || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
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
