import { statusCodes, Message } from '../../core/common/constant.js'
import {
  listProBucketQueryProductsSchema,
  getProBucketByIdParamSchema,
  appendProBucketRatesSchema,
  appendProBucketRatesParamSchema,
} from '../../validator/proBucket/proBucket.validator.js'
import {
  listProBucketQueryProducts,
  getProBucketQueryProductById,
  appendProBucketRates,
} from '../../services/proBucket/proBucket.service.js'

export const listProBucketQueryProductsController = async (req, res) => {
  const { error, value } = listProBucketQueryProductsSchema.validate(
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
  const data = await listProBucketQueryProducts(value, req.user)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Pro Bucket items retrieved',
    data,
  })
}

export const getProBucketQueryProductByIdController = async (req, res) => {
  const { error, value } = getProBucketByIdParamSchema.validate(
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
  const doc = await getProBucketQueryProductById(value.id, req.user)
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

export const appendProBucketRatesController = async (req, res) => {
  const param = appendProBucketRatesParamSchema.validate(
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
  const { error, value } = appendProBucketRatesSchema.validate(req.body, {
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
    const doc = await appendProBucketRates(
      param.value.id,
      value.rates,
      req.user
    )
    if (!doc) {
      return res.status(statusCodes.notFound).json({
        success: false,
        message: 'Item not found or not allowed',
      })
    }
    return res.status(statusCodes.ok).json({
      success: true,
      message: 'Rates added',
      data: doc,
    })
  } catch (e) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: e?.message || 'Failed to add rates',
    })
  }
}
