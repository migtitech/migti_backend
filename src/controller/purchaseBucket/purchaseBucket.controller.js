import { statusCodes, Message } from '../../core/common/constant.js'
import {
  listPurchaseBucketSchema,
  purchaseBucketIdParamSchema,
  raisePaymentRequestBodySchema,
  updatePoProductLineAttachmentBodySchema,
} from '../../validator/purchaseBucket/purchaseBucket.validator.js'
import {
  listPurchaseBucketPoProducts,
  getPurchaseBucketPoProductById,
  raisePurchaseBucketPaymentRequest,
  markPurchaseBucketLinePurchased,
  updatePoProductLineAttachment,
  getPurchaseBillingRequestStatusCounts,
} from '../../services/purchaseBucket/purchaseBucket.service.js'

export const listPurchaseBucketPoProductsController = async (req, res) => {
  const { error, value } = listPurchaseBucketSchema.validate(req.query, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }
  const data = await listPurchaseBucketPoProducts(value, req.user)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Purchase Bucket items retrieved',
    data,
  })
}

export const getPurchaseBucketPoProductByIdController = async (req, res) => {
  const { error, value } = purchaseBucketIdParamSchema.validate(
    { id: req.params?.id },
    { abortEarly: false }
  )
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }
  const doc = await getPurchaseBucketPoProductById(value.id, req.user)
  if (!doc) {
    return res.status(statusCodes.notFound).json({
      success: false,
      message: 'Item not found',
    })
  }
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Item retrieved',
    data: doc,
  })
}

export const raisePurchaseBucketPaymentRequestController = async (req, res) => {
  const param = purchaseBucketIdParamSchema.validate(
    { id: req.params?.id },
    { abortEarly: false }
  )
  if (param.error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: param.error.details.map((d) => d.message),
    })
  }
  const { error, value } = raisePaymentRequestBodySchema.validate(req.body, {
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
    const doc = await raisePurchaseBucketPaymentRequest({
      id: param.value.id,
      amount: value.amount,
      attachmentDocumentId: value.attachmentDocumentId,
      remark: value.remark,
      user: req.user,
    })
    return res.status(statusCodes.ok).json({
      success: true,
      message: 'Payment request raised',
      data: doc,
    })
  } catch (e) {
    const status = e?.statusCode || statusCodes.badRequest
    return res.status(status).json({
      success: false,
      message: e?.message || 'Failed to raise payment request',
    })
  }
}

export const updatePoProductLineAttachmentController = async (req, res) => {
  const param = purchaseBucketIdParamSchema.validate(
    { id: req.params?.id },
    { abortEarly: false }
  )
  if (param.error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: param.error.details.map((d) => d.message),
    })
  }
  const { error, value } = updatePoProductLineAttachmentBodySchema.validate(
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
    const doc = await updatePoProductLineAttachment({
      id: param.value.id,
      attachmentDocumentId: value.attachmentDocumentId,
      user: req.user,
    })
    if (!doc) {
      return res.status(statusCodes.notFound).json({
        success: false,
        message: 'Item not found',
      })
    }
    return res.status(statusCodes.ok).json({
      success: true,
      message: 'Product image updated',
      data: doc,
    })
  } catch (e) {
    const status = e?.statusCode || statusCodes.badRequest
    return res.status(status).json({
      success: false,
      message: e?.message || 'Failed to update attachment',
    })
  }
}

export const getPurchaseBillingRequestStatusCountsController = async (
  _req,
  res
) => {
  const data = await getPurchaseBillingRequestStatusCounts()
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Billing request status counts',
    data,
  })
}

export const markPurchaseBucketLinePurchasedController = async (req, res) => {
  const { error, value } = purchaseBucketIdParamSchema.validate(
    { id: req.params?.id },
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
    const doc = await markPurchaseBucketLinePurchased({
      id: value.id,
      user: req.user,
    })
    return res.status(statusCodes.ok).json({
      success: true,
      message: 'Line marked as purchased',
      data: doc,
    })
  } catch (e) {
    const status = e?.statusCode || statusCodes.badRequest
    return res.status(status).json({
      success: false,
      message: e?.message || 'Failed to mark line as purchased',
    })
  }
}
