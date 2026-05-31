import { statusCodes, Message } from '../../core/common/constant.js'
import {
  assignLocalPurchaseSchema,
  getLocalPurchaseByIdSchema,
  listLocalPurchasesSchema,
  submitLocalPurchaseBodySchema,
  submitLocalPurchaseParamSchema,
  updateLocalPurchaseAttachmentsBodySchema,
  updateLocalPurchaseAttachmentsParamSchema,
} from '../../validator/localPurchase/localPurchase.validator.js'
import {
  assignLocalPurchase,
  getLocalPurchaseById,
  listLocalPurchaseEmployees,
  listLocalPurchases,
  submitLocalPurchase,
  updateLocalPurchaseAttachments,
} from '../../services/localPurchase/localPurchase.service.js'

export const listLocalPurchaseEmployeesController = async (req, res) => {
  const data = await listLocalPurchaseEmployees()
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Local purchase employees retrieved',
    data,
  })
}

export const assignLocalPurchaseController = async (req, res) => {
  const { error, value } = assignLocalPurchaseSchema.validate(req.body, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  try {
    const doc = await assignLocalPurchase({
      poProductId: value.poProductId,
      employeeId: value.employeeId,
      remark: value.remark,
      supplier: value.supplier,
      locationLink: value.locationLink,
      assignedBy: req.user?.id || req.user?._id,
      branchIdFromUser: req.user?.branchId || null,
    })
    if (!doc) {
      return res.status(statusCodes.notFound).json({
        success: false,
        message: 'PO product not found',
      })
    }
    return res.status(statusCodes.ok).json({
      success: true,
      message: 'Local purchase assigned',
      data: doc,
    })
  } catch (e) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: e?.message || 'Failed to assign local purchase',
    })
  }
}

export const submitLocalPurchaseController = async (req, res) => {
  const paramCheck = submitLocalPurchaseParamSchema.validate(
    { id: req.params.id },
    { abortEarly: false }
  )
  if (paramCheck.error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: paramCheck.error.details.map((d) => d.message),
    })
  }

  const { error, value } = submitLocalPurchaseBodySchema.validate(req.body, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  try {
    const doc = await submitLocalPurchase(paramCheck.value.id, value, req.user)
    if (!doc) {
      return res.status(statusCodes.notFound).json({
        success: false,
        message: 'Local purchase assignment not found',
      })
    }
    return res.status(statusCodes.ok).json({
      success: true,
      message: 'Local purchase submitted',
      data: doc,
    })
  } catch (e) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: e?.message || 'Failed to submit local purchase',
    })
  }
}

export const updateLocalPurchaseAttachmentsController = async (req, res) => {
  const paramCheck = updateLocalPurchaseAttachmentsParamSchema.validate(
    { id: req.params.id },
    { abortEarly: false }
  )
  if (paramCheck.error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: paramCheck.error.details.map((d) => d.message),
    })
  }

  const { error, value } = updateLocalPurchaseAttachmentsBodySchema.validate(
    req.body,
    { abortEarly: false }
  )
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  try {
    const doc = await updateLocalPurchaseAttachments(
      paramCheck.value.id,
      value,
      req.user
    )
    if (!doc) {
      return res.status(statusCodes.notFound).json({
        success: false,
        message: 'Local purchase assignment not found',
      })
    }
    return res.status(statusCodes.ok).json({
      success: true,
      message: 'Attachments updated',
      data: doc,
    })
  } catch (e) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: e?.message || 'Failed to update attachments',
    })
  }
}

export const getLocalPurchaseByIdController = async (req, res) => {
  const { error, value } = getLocalPurchaseByIdSchema.validate(
    { id: req.params.id },
    { abortEarly: false }
  )
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const data = await getLocalPurchaseById(value.id, req.user)
  if (!data) {
    return res.status(statusCodes.notFound).json({
      success: false,
      message: 'Local purchase assignment not found',
    })
  }

  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Local purchase retrieved',
    data,
  })
}

export const listLocalPurchasesController = async (req, res) => {
  const { error, value } = listLocalPurchasesSchema.validate(req.query, {
    abortEarly: false,
    convert: true,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const data = await listLocalPurchases(value, req.user)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Local purchases retrieved',
    data,
  })
}
