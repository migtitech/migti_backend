import { Message, statusCodes } from '../../core/common/constant.js'
import { notifyBranchHods } from '../../services/notification/notification.service.js'
import {
  listPurchaseBillingRequestsSchema,
  idParamSchema,
  updateRemarkBodySchema,
  approveBodySchema,
  updateProofBodySchema,
} from '../../validator/purchaseBillingRequest/purchaseBillingRequest.validator.js'
import {
  listPurchaseBillingRequests,
  getPurchaseBillingRequestById,
  updatePurchaseBillingRequestRemark,
  updatePurchaseBillingRequestProof,
  approvePurchaseBillingRequest,
} from '../../services/purchaseBillingRequest/purchaseBillingRequest.service.js'

export const listPurchaseBillingRequestsController = async (req, res) => {
  const { error, value } = listPurchaseBillingRequestsSchema.validate(
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
  const data = await listPurchaseBillingRequests(value)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Purchase billing requests retrieved',
    data,
  })
}

export const getPurchaseBillingRequestByIdController = async (req, res) => {
  const { error, value } = idParamSchema.validate(req.params, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }
  const data = await getPurchaseBillingRequestById(value.id)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Purchase billing request retrieved',
    data,
  })
}

export const updatePurchaseBillingRequestRemarkController = async (
  req,
  res
) => {
  const { error: pErr, value: pVal } = idParamSchema.validate(req.params, {
    abortEarly: false,
  })
  if (pErr) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: pErr.details.map((d) => d.message),
    })
  }
  const { error, value } = updateRemarkBodySchema.validate(req.body, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }
  const data = await updatePurchaseBillingRequestRemark(
    pVal.id,
    value.statusRemark
  )
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Remark saved',
    data,
  })
}

export const updatePurchaseBillingRequestProofController = async (
  req,
  res
) => {
  const { error: pErr, value: pVal } = idParamSchema.validate(req.params, {
    abortEarly: false,
  })
  if (pErr) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: pErr.details.map((d) => d.message),
    })
  }
  const { error, value } = updateProofBodySchema.validate(req.body, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }
  const data = await updatePurchaseBillingRequestProof(
    pVal.id,
    value.proofDocumentId
  )
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Proof updated',
    data,
  })
}

export const approvePurchaseBillingRequestController = async (req, res) => {
  const { error: pErr, value: pVal } = idParamSchema.validate(req.params, {
    abortEarly: false,
  })
  if (pErr) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: pErr.details.map((d) => d.message),
    })
  }
  const { error, value } = approveBodySchema.validate(req.body, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }
  const data = await approvePurchaseBillingRequest(
    pVal.id,
    value.statusRemark,
    req.user
  )
  const io = req.app.get('io')
  await notifyBranchHods(
    io,
    data?.branchId,
    'Billing request approved',
    `Purchase billing request for ${data?.poCode || 'PO'} · ${data?.productName || 'product'} was approved (₹${Number(data?.amount || 0).toLocaleString('en-IN')}).`,
    {
      eventType: 'billing_request_approved',
      purchaseBillingRequestId: String(pVal.id),
      poCode: data?.poCode,
    }
  )
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Billing request approved',
    data,
  })
}
