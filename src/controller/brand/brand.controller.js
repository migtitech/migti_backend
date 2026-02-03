import { Message, statusCodes } from '../../core/common/constant.js'
import {
  createBrandSchema,
  listBrandSchema,
  getBrandByIdSchema,
  updateBrandSchema,
  deleteBrandSchema,
} from '../../validator/brand/brand.validator.js'
import {
  addBrand,
  listBrands,
  getBrandById,
  updateBrand,
  deleteBrand,
} from '../../services/brand/brand.service.js'

export const createBrandController = async (req, res) => {
  const { error, value } = createBrandSchema.validate(req.body, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const result = await addBrand(value)
  return res.status(statusCodes.created).json({
    success: true,
    message: 'Brand created successfully',
    data: result,
  })
}

export const listBrandsController = async (req, res) => {
  const { error, value } = listBrandSchema.validate(req.query, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const result = await listBrands(value)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Brands retrieved successfully',
    data: result,
  })
}

export const getBrandByIdController = async (req, res) => {
  const { error, value } = getBrandByIdSchema.validate(req.query, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const result = await getBrandById(value)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Brand details retrieved successfully',
    data: result,
  })
}

export const updateBrandController = async (req, res) => {
  const { error, value } = updateBrandSchema.validate(
    { ...req.body, ...req.query },
    {
      abortEarly: false,
    },
  )
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const result = await updateBrand(value)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Brand updated successfully',
    data: result,
  })
}

export const deleteBrandController = async (req, res) => {
  const { error, value } = deleteBrandSchema.validate(req.query, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const result = await deleteBrand(value)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Brand deleted successfully',
    data: result,
  })
}
