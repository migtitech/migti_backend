import DocumentModel from '../../models/document.model.js'
import { Message } from '../common/constant.js'
import { uploadToS3, uploadMultipleToS3 } from './s3bucket.js'
import path from 'path'

/**
 * Upload a single file to S3 and create a DocumentModel entry
 */
export const uploadDocument = async (file, folder = 'general') => {
  try {
    const uploadResult = await uploadToS3(
      file,
      process.env.AWS_BUCKET_NAME,
      folder
    )

    if (!uploadResult.success) {
      throw new Error(uploadResult.message)
    }

    const uploaded = uploadResult?.data
    const extension = path.extname(uploaded.fileName).replace('.', '')

    const document = await DocumentModel.create({
      filename: uploaded?.originalName,
      filetype: uploaded?.mimetype,
      extension: extension,
      filesize: uploaded?.size,
      key: uploaded?.key,
      fullUrl: uploaded?.url,
    })

    return {
      success: true,
      message: Message?.documentUploaded,
      data: document,
    }
  } catch (error) {
    console.error('Upload Document Error:', error)
    return {
      success: false,
      message: `${Message?.documentUploadFailed} ${error.message}`,
      data: null,
    }
  }
}

/**
 * Upload multiple files to S3 and create multiple DocumentModel entries
 */
export const uploadMultipleDocuments = async (files, folder = 'general') => {
  try {
    const uploadResults = await uploadMultipleToS3(
      files,
      process.env.AWS_BUCKET_NAME,
      folder
    )

    // create all docs in parallel
    const successfulDocs = await Promise.all(
      uploadResults.data.successful.map((uploaded) => {
        const extension = path.extname(uploaded?.fileName).replace('.', '')
        return DocumentModel.create({
          filename: uploaded?.originalName,
          filetype: uploaded?.mimetype,
          extension,
          filesize: uploaded?.size,
          key: uploaded?.key,
          fullUrl: uploaded?.url,
        })
      })
    )

    return {
      success: uploadResults?.success,
      message: uploadResults?.message,
      data: {
        successful: successfulDocs,
        failed: uploadResults?.data.failed,
      },
    }
  } catch (error) {
    console.error('Upload Multiple Documents Error:', error)
    return {
      success: false,
      message: `${Message?.documentUploadFailed} ${error.message}`,
      data: null,
    }
  }
}
