import path from 'path'
import { statusCodes } from '../../core/common/constant.js'
import {
  createDocumentsForUploadedFiles,
  transformPathsToSignedUrls,
  getDocumentServeInfo,
} from '../../services/document/document.service.js'

/**
 * Upload images: S3 when configured (images/products/{timestamp}) else local assets.
 * Stores URL (S3) or path (local) in documents table.
 * Returns: { documents: [{ _id, path }] } - path is signed URL for S3 (private bucket) or relative path for local
 */
export const uploadDocumentsController = async (req, res) => {
  const files =
    Array.isArray(req.files) && req.files.length > 0
      ? req.files
      : req.file
        ? [req.file]
        : []

  if (!files.length) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: 'No files uploaded',
    })
  }

  const documents = await createDocumentsForUploadedFiles(files)
  if (!documents || documents.length === 0) {
    return res.status(statusCodes.internalServerError).json({
      success: false,
      message: 'Upload failed: no document records were created',
    })
  }
  const documentsWithSignedUrls = await transformPathsToSignedUrls(documents)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Files uploaded successfully',
    data: { documents: documentsWithSignedUrls },
  })
}

/**
 * Serve document image by id (auth required). Streams local file or redirects to S3 signed URL.
 */
export const serveDocumentController = async (req, res) => {
  const { id } = req.params
  if (!id) {
    return res.status(statusCodes.badRequest).json({ success: false, message: 'Document id required' })
  }
  const info = await getDocumentServeInfo(id)
  if (!info) {
    return res.status(statusCodes.notFound).json({ success: false, message: 'Document not found' })
  }
  if (info.type === 's3') {
    return res.redirect(302, info.signedUrl)
  }
  res.sendFile(path.resolve(info.filePath), (err) => {
    if (err) res.status(statusCodes.notFound).json({ success: false, message: 'File not found' })
  })
}
