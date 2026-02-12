import { Message, statusCodes } from '../../core/common/constant.js'
import {
  uploadImagesSchema,
  deleteImageSchema,
} from '../../validator/image/image.validator.js'
import {
  uploadFilesToS3AndSave,
  deleteImageById,
} from '../../services/image/image.service.js'
import { S3_CONFIG } from '../../core/config/s3.config.js'

export const uploadImagesController = async (req, res) => {
  const { error, value } = uploadImagesSchema.validate(req.query, {
    abortEarly: false,
  })

  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  if (!req.files || req.files.length === 0) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: 'No files uploaded',
    })
  }

  if (!S3_CONFIG.isConfigured) {
    return res.status(statusCodes.badGateway).json({
      success: false,
      message: 'S3 storage is not configured',
    })
  }

  const result = await uploadFilesToS3AndSave({
    files: req.files,
    referenceId: value.productId,
    imageType: value.imageType || 'product',
    variantCombinationUniqueId: value.variantCombinationUniqueId || null,
  })

  return res.status(statusCodes.created).json({
    success: true,
    message: 'Images uploaded successfully',
    data: { images: result },
  })
}

export const deleteImageController = async (req, res) => {
  const { error, value } = deleteImageSchema.validate(req.query, {
    abortEarly: false,
  })

  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const result = await deleteImageById(value.imageId)

  if (!result) {
    return res.status(statusCodes.notFound).json({
      success: false,
      message: 'Image not found',
    })
  }

  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Image deleted successfully',
    data: result,
  })
}
