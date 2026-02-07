import { Message, statusCodes } from '../../core/common/constant.js'
import {
  createProductSchema,
  listProductSchema,
  getProductByIdSchema,
  updateProductSchema,
  deleteProductSchema,
} from '../../validator/product/product.validator.js'
import {
  addProduct,
  listProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from '../../services/product/product.service.js'

export const createProductController = async (req, res) => {
  const { error, value } = createProductSchema.validate(req.body, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const result = await addProduct(value)
  return res.status(statusCodes.created).json({
    success: true,
    message: 'Product created successfully',
    data: result,
  })
}

export const listProductsController = async (req, res) => {
  const { error, value } = listProductSchema.validate(req.query, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const result = await listProducts(value)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Products retrieved successfully',
    data: result,
  })
}

export const getProductByIdController = async (req, res) => {
  const { error, value } = getProductByIdSchema.validate(req.query, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const result = await getProductById(value)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Product details retrieved successfully',
    data: result,
  })
}

export const updateProductController = async (req, res) => {
  const { error, value } = updateProductSchema.validate(
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

  const result = await updateProduct(value)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Product updated successfully',
    data: result,
  })
}

export const deleteProductController = async (req, res) => {
  const { error, value } = deleteProductSchema.validate(req.query, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const result = await deleteProduct(value)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Product deleted successfully',
    data: result,
  })
}

export const uploadProductImagesController = async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: 'No files uploaded',
    })
  }

  const imagePaths = req.files.map((file) => `/uploads/${file.filename}`)

  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Images uploaded successfully',
    data: { images: imagePaths },
  })
}

export const uploadProductImagesS3Controller = async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: 'No files uploaded',
    })
  }

  const productId = req.query?.productId

  if (!productId) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: 'productId is required for S3 upload',
    })
  }

  const { uploadFilesToS3AndSave } = await import(
    '../../services/image/image.service.js'
  )
  const { S3_CONFIG } = await import('../../core/config/s3.config.js')

  if (!S3_CONFIG.isConfigured) {
    return res.status(statusCodes.badGateway).json({
      success: false,
      message: 'S3 storage is not configured',
    })
  }

  const result = await uploadFilesToS3AndSave({
    files: req.files,
    referenceId: productId,
    imageType: 'product',
    folderPath: 'products',
  })

  return res.status(statusCodes.created).json({
    success: true,
    message: 'Images uploaded successfully',
    data: { images: result },
  })
}
