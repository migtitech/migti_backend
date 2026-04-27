import { statusCodes, Message } from '../../core/common/constant.js'
import {
  listInventoryBucketSchema,
  inventoryBucketIdParamSchema,
} from '../../validator/inventoryBucket/inventoryBucket.validator.js'
import {
  listInventoryBucketPoProducts,
  getInventoryBucketPoProductById,
  markInventoryReceived,
  markReadyForDispatchment,
} from '../../services/inventoryBucket/inventoryBucket.service.js'

export const listInventoryBucketPoProductsController = async (req, res) => {
  const { error, value } = listInventoryBucketSchema.validate(req.query, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }
  const data = await listInventoryBucketPoProducts(value, req.user)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Inventory bucket items retrieved',
    data,
  })
}

export const getInventoryBucketPoProductByIdController = async (req, res) => {
  const { error, value } = inventoryBucketIdParamSchema.validate(
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
  const doc = await getInventoryBucketPoProductById(value.id, req.user)
  if (!doc) {
    return res.status(statusCodes.notFound).json({
      success: false,
      message: 'Item not found or not allowed',
    })
  }
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Item retrieved',
    data: doc,
  })
}

export const markInventoryReceivedController = async (req, res) => {
  const { error, value } = inventoryBucketIdParamSchema.validate(
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
  const doc = await markInventoryReceived(value.id, req.user)
  if (!doc) {
    return res.status(statusCodes.notFound).json({
      success: false,
      message: 'Item not found or not allowed',
    })
  }
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Marked as inventory received',
    data: doc,
  })
}

export const markReadyForDispatchmentController = async (req, res) => {
  const { error, value } = inventoryBucketIdParamSchema.validate(
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
  const doc = await markReadyForDispatchment(value.id, req.user)
  if (!doc) {
    return res.status(statusCodes.notFound).json({
      success: false,
      message: 'Item not found or not allowed',
    })
  }
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Marked ready for dispatchment',
    data: doc,
  })
}
