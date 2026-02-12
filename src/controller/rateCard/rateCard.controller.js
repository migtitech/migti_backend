import { Message, statusCodes } from '../../core/common/constant.js'
import {
  upsertRateSchema,
  getByProductSchema,
  getBySupplierSchema,
  deleteRateCardSchema,
  searchProductsSchema,
  searchSuppliersSchema,
} from '../../validator/rateCard/rateCard.validator.js'
import {
  upsertRate,
  getSuppliersByProduct,
  getProductsBySupplier,
  deleteRateCard,
  searchProducts,
  searchSuppliers,
} from '../../services/rateCard/rateCard.service.js'

export const upsertRateController = async (req, res) => {
  const { error, value } = upsertRateSchema.validate(req.body, { abortEarly: false })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const result = await upsertRate(value)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Rate saved successfully',
    data: result,
  })
}

export const getByProductController = async (req, res) => {
  const { error, value } = getByProductSchema.validate(req.query, { abortEarly: false })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const result = await getSuppliersByProduct(value)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Suppliers retrieved successfully',
    data: result,
  })
}

export const getBySupplierController = async (req, res) => {
  const { error, value } = getBySupplierSchema.validate(req.query, { abortEarly: false })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const result = await getProductsBySupplier(value)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Products retrieved successfully',
    data: result,
  })
}

export const deleteRateCardController = async (req, res) => {
  const { error, value } = deleteRateCardSchema.validate(req.query, { abortEarly: false })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const result = await deleteRateCard(value)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Rate card entry deleted successfully',
    data: result,
  })
}

export const searchProductsController = async (req, res) => {
  const { error, value } = searchProductsSchema.validate(req.query, { abortEarly: false })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const result = await searchProducts(value)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Products retrieved successfully',
    data: result,
  })
}

export const searchSuppliersController = async (req, res) => {
  const { error, value } = searchSuppliersSchema.validate(req.query, { abortEarly: false })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const result = await searchSuppliers(value)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Suppliers retrieved successfully',
    data: result,
  })
}
