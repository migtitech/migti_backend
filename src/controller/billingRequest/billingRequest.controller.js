import { statusCodes, Message } from '../../core/common/constant.js'
import { createBillingRequestSchema } from '../../validator/billingRequest/billingRequest.validator.js'
import {
  createBillingRequest,
  listBillingRequests,
  getBillingRequestById,
  financeApproveBillingRequest,
  hodProductAction,
  resubmitProduct,
  markProductPurchased,
} from '../../services/billingRequest/billingRequest.service.js'

export const listBillingRequestsController = async (req, res) => {
  const { pageNumber, pageSize, status, poCode, dateFrom, dateTo } = req.query
  const data = await listBillingRequests({ pageNumber, pageSize, status, poCode, dateFrom, dateTo })
  return res.status(statusCodes.ok).json({ success: true, data })
}

export const getBillingRequestByIdController = async (req, res) => {
  const doc = await getBillingRequestById(req.params.id)
  return res.status(statusCodes.ok).json({ success: true, data: doc })
}

export const hodProductActionController = async (req, res) => {
  const { action, remark } = req.body
  try {
    const doc = await hodProductAction({
      billingRequestId: req.params.id,
      productId: req.params.productId,
      action,
      remark,
      user: req.user,
    })
    return res.status(statusCodes.ok).json({ success: true, data: doc })
  } catch (e) {
    const status = e?.statusCode || statusCodes.badRequest
    return res.status(status).json({
      success: false,
      message: e?.message || 'Failed to process product action',
    })
  }
}

export const financeApproveBillingRequestController = async (req, res) => {
  const { financeRemark, paidAmount, paymentProofDocId } = req.body
  try {
    const doc = await financeApproveBillingRequest({
      id: req.params.id,
      financeRemark,
      paidAmount,
      paymentProofDocId,
      user: req.user,
    })
    return res.status(statusCodes.ok).json({ success: true, data: doc })
  } catch (e) {
    const status = e?.statusCode || statusCodes.badRequest
    return res.status(status).json({
      success: false,
      message: e?.message || 'Failed to finance-approve billing request',
    })
  }
}

export const markProductPurchasedController = async (req, res) => {
  try {
    const doc = await markProductPurchased({
      billingRequestId: req.params.id,
      productId: req.params.productId,
    })
    return res.status(statusCodes.ok).json({ success: true, data: doc })
  } catch (e) {
    const status = e?.statusCode || statusCodes.badRequest
    return res.status(status).json({
      success: false,
      message: e?.message || 'Failed to mark product as purchased',
    })
  }
}

export const resubmitProductController = async (req, res) => {
  const { billDocId, productImageDocId, amount, remark } = req.body
  try {
    const doc = await resubmitProduct({
      billingRequestId: req.params.id,
      productId: req.params.productId,
      billDocId,
      productImageDocId,
      amount,
      remark,
    })
    return res.status(statusCodes.ok).json({ success: true, data: doc })
  } catch (e) {
    const status = e?.statusCode || statusCodes.badRequest
    return res.status(status).json({
      success: false,
      message: e?.message || 'Failed to resubmit product',
    })
  }
}

export const createBillingRequestController = async (req, res) => {
  const { error, value } = createBillingRequestSchema.validate(req.body, {
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
    const doc = await createBillingRequest({
      products: value.products,
      user: req.user,
    })
    return res.status(statusCodes.created).json({
      success: true,
      message: 'Billing request created',
      data: doc,
    })
  } catch (e) {
    const status = e?.statusCode || statusCodes.badRequest
    return res.status(status).json({
      success: false,
      message: e?.message || 'Failed to create billing request',
    })
  }
}
