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
  result.products = await transformProductImagesToSigned(result.products)
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
  const data = await transformProductImagesToSigned(result)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Product details retrieved successfully',
    data,
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

import {
  createDocumentsForUploadedFiles,
  transformPathsToSignedUrls,
  transformProductImagesToSigned,
} from '../../services/document/document.service.js'

export const uploadProductImagesController = async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: 'No files uploaded',
    })
  }

  const documents = await createDocumentsForUploadedFiles(req.files)
  const documentsWithSignedUrls = await transformPathsToSignedUrls(documents)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Images uploaded successfully',
    data: { documents: documentsWithSignedUrls },
  })
}
