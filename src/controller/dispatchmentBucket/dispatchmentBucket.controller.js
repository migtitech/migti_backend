import { statusCodes, Message } from '../../core/common/constant.js'
import {
  listDispatchmentBucketSchema,
  dispatchmentBucketIdParamSchema,
} from '../../validator/dispatchmentBucket/dispatchmentBucket.validator.js'
import {
  listDispatchmentQueuePoProducts,
  markPoProductDelivered,
} from '../../services/dispatchmentBucket/dispatchmentBucket.service.js'
import {
  getInventoryBucketPoProductById,
  markReadyForDispatchment,
} from '../../services/inventoryBucket/inventoryBucket.service.js'

export const listDispatchmentQueuePoProductsController = async (req, res) => {
  const { error, value } = listDispatchmentBucketSchema.validate(req.query, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }
  const data = await listDispatchmentQueuePoProducts(value, req.user)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Dispatchment queue items retrieved',
    data,
  })
}

export const getDispatchmentQueuePoProductByIdController = async (req, res) => {
  const { error, value } = dispatchmentBucketIdParamSchema.validate(
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

export const markReadyForDispatchmentFromQueueController = async (req, res) => {
  const { error, value } = dispatchmentBucketIdParamSchema.validate(
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

export const markPoProductDeliveredController = async (req, res) => {
  const { error, value } = dispatchmentBucketIdParamSchema.validate(
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
  const doc = await markPoProductDelivered(value.id, req.user)
  if (!doc) {
    return res.status(statusCodes.notFound).json({
      success: false,
      message: 'Item not found or not allowed',
    })
  }
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Marked as delivered',
    data: doc,
  })
}
