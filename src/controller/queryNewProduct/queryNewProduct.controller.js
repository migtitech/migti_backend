import { Message, statusCodes } from '../../core/common/constant.js'
import {
  createQueryNewProductSchema,
  listQueryNewProductSchema,
  getQueryNewProductByIdSchema,
  deleteQueryNewProductSchema,
} from '../../validator/queryNewProduct/queryNewProduct.validator.js'
import {
  addQueryNewProduct,
  listQueryNewProducts,
  getQueryNewProductById,
  deleteQueryNewProduct,
} from '../../services/queryNewProduct/queryNewProduct.service.js'

export const createQueryNewProductController = async (req, res) => {
  const { error, value } = createQueryNewProductSchema.validate(req.body, {
    abortEarly: false,
  })

  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const result = await addQueryNewProduct(value)

  return res.status(statusCodes.created).json({
    success: true,
    message: 'New product captured successfully',
    data: result,
  })
}

export const listQueryNewProductsController = async (req, res) => {
  const { error, value } = listQueryNewProductSchema.validate(req.query, {
    abortEarly: false,
  })

  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const result = await listQueryNewProducts(value)

  return res.status(statusCodes.ok).json({
    success: true,
    message: 'New products retrieved successfully',
    data: result,
  })
}

export const getQueryNewProductByIdController = async (req, res) => {
  const { error, value } = getQueryNewProductByIdSchema.validate(req.query, {
    abortEarly: false,
  })

  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const result = await getQueryNewProductById(value)

  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Product details retrieved successfully',
    data: result,
  })
}

export const deleteQueryNewProductController = async (req, res) => {
  const { error, value } = deleteQueryNewProductSchema.validate(req.query, {
    abortEarly: false,
  })

  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const result = await deleteQueryNewProduct(value)

  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Product deleted successfully',
    data: result,
  })
}
