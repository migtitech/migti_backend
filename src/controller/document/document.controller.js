import { statusCodes } from '../../core/common/constant.js'
import { createDocumentsForUploadedFiles } from '../../services/document/document.service.js'

/**
 * Upload images: S3 when configured (images/products/{timestamp}) else local assets.
 * Stores URL (S3) or path (local) in documents table.
 * Returns: { documents: [{ _id, path }] } - path is full S3 URL or relative path
 */
export const uploadDocumentsController = async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: 'No files uploaded',
    })
  }

  const documents = await createDocumentsForUploadedFiles(req.files)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Images uploaded successfully',
    data: { documents },
  })
}
