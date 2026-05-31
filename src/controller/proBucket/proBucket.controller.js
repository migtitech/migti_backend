import { statusCodes, Message } from '../../core/common/constant.js'
import {
  listProBucketQueryProductsSchema,
  getProBucketByIdParamSchema,
  appendProBucketRatesSchema,
  appendProBucketRatesParamSchema,
  updateQueryProductParamSchema,
  updateQueryProductBodySchema,
  updateQueryProductHodRatesParamSchema,
  updateQueryProductHodRatesBodySchema,
  listQueryProductHodRateHistoriesParamSchema,
  listQueryProductHodRateHistoriesQuerySchema,
} from '../../validator/proBucket/proBucket.validator.js'
import {
  listProBucketQueryProducts,
  getProBucketQueryProductById,
  appendProBucketRates,
  updateQueryProduct,
  updateQueryProductHodRates,
  listQueryProductHodRateHistories,
} from '../../services/proBucket/proBucket.service.js'

export const listProBucketQueryProductsController = async (req, res) => {
  const { error, value } = listProBucketQueryProductsSchema.validate(
    req.query,
    { abortEarly: false, convert: true }
  )
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }
  const data = await listProBucketQueryProducts(value)
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
  const doc = await getProBucketQueryProductById(value.id)
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
      req.user,
      req.app.get('io')
    )
    if (!doc) {
      return res.status(statusCodes.notFound).json({
        success: false,
        message: 'Item not found',
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

export const updateQueryProductController = async (req, res) => {
  const param = updateQueryProductParamSchema.validate(
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

  const { error, value } = updateQueryProductBodySchema.validate(req.body, {
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
    const doc = await updateQueryProduct(param.value.id, value)
    if (!doc) {
      return res.status(statusCodes.notFound).json({
        success: false,
        message: 'Query product not found',
      })
    }
    return res.status(statusCodes.ok).json({
      success: true,
      message: 'Query product updated',
      data: doc,
    })
  } catch (e) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: e?.message || 'Failed to update query product',
    })
  }
}

export const updateQueryProductHodRatesController = async (req, res) => {
  const param = updateQueryProductHodRatesParamSchema.validate(
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

  const { error, value } = updateQueryProductHodRatesBodySchema.validate(
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
    const doc = await updateQueryProductHodRates(
      param.value.id,
      value,
      req.user
    )
    if (!doc) {
      return res.status(statusCodes.notFound).json({
        success: false,
        message: 'Query product not found',
      })
    }
    return res.status(statusCodes.ok).json({
      success: true,
      message: 'Rates updated',
      data: doc,
    })
  } catch (e) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: e?.message || 'Failed to update rates',
    })
  }
}

export const listQueryProductHodRateHistoriesController = async (req, res) => {
  const param = listQueryProductHodRateHistoriesParamSchema.validate(
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

  const { error, value } = listQueryProductHodRateHistoriesQuerySchema.validate(
    req.query,
    { abortEarly: false, convert: true }
  )
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  try {
    const result = await listQueryProductHodRateHistories(
      param.value.id,
      value,
      req.user
    )
    if (!result) {
      return res.status(statusCodes.notFound).json({
        success: false,
        message: 'Query product not found',
      })
    }
    return res.status(statusCodes.ok).json({
      success: true,
      message: 'Rate history retrieved',
      data: result,
    })
  } catch (e) {
    const msg = e?.message || 'Failed to load rate history'
    const status = msg.includes('Head of Department')
      ? statusCodes.forbidden
      : statusCodes.badRequest
    return res.status(status).json({
      success: false,
      message: msg,
    })
  }
}
