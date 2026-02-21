import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
})

export const uploadToS3 = async (
  file,
  bucketName = process.env.AWS_BUCKET_NAME,
  folder = 'general'
) => {
  try {
    if (!file) {
      return {
        success: false,
        message: 'No file provided',
        data: null,
      }
    }

    if (!file.buffer || !Buffer.isBuffer(file.buffer)) {
      return {
        success: false,
        message: 'File buffer is required (use multer memory storage)',
        data: null,
      }
    }

    if (!bucketName) {
      return {
        success: false,
        message: 'Bucket name is required',
        data: null,
      }
    }

    // Check AWS credentials
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      return {
        success: false,
        message: 'AWS credentials not configured',
        data: null,
      }
    }

    console.log('Starting S3 upload for file:', file.originalname)

    const fileExtension = path.extname(file.originalname) || '.jpg'
    const base = (file.originalname || 'file').replace(/\s+/g, '-').slice(0, 50)
    const fileName = `${base}-${Date.now()}-${uuidv4().slice(0, 8)}${fileExtension}`
    const key = folder ? `${folder}/${fileName}` : fileName

    const uploadParams = {
      Bucket: bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      // ACL removed - bucket doesn't allow ACLs, use bucket policy instead
    }

    const command = new PutObjectCommand(uploadParams)

    // Add timeout to prevent infinite hanging
    const uploadPromise = s3Client.send(command)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(
        () => reject(new Error('Upload timeout after 30 seconds')),
        30000
      )
    })

    const result = await Promise.race([uploadPromise, timeoutPromise])

    const region = process.env.AWS_REGION || 'us-east-1'
    const fileUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`

    console.log('S3 upload completed successfully for:', file.originalname)

    return {
      success: true,
      message: 'File uploaded successfully',
      data: {
        fileName: fileName,
        originalName: file.originalname,
        key: key,
        url: fileUrl,
        size: file.size,
        mimetype: file.mimetype,
        etag: result.ETag,
      },
    }
  } catch (error) {
    console.error('S3 Upload Error:', error)
    return {
      success: false,
      message: `Upload failed: ${error.message}`,
      data: null,
      error: error.message,
    }
  }
}

export const uploadMultipleToS3 = async (
  files,
  bucketName = process.env.AWS_BUCKET_NAME,
  folder = 'general'
) => {
  try {
    if (!files || files.length === 0) {
      return {
        success: false,
        message: 'No files provided',
        data: null,
      }
    }

    if (!bucketName) {
      return {
        success: false,
        message: 'Bucket name is required',
        data: null,
      }
    }

    const uploadPromises = files.map((file) =>
      uploadToS3(file, bucketName, folder)
    )
    const results = await Promise.all(uploadPromises)

    const successfulUploads = results.filter((result) => result.success)
    const failedUploads = results.filter((result) => !result.success)

    return {
      success: failedUploads.length === 0,
      message:
        failedUploads.length === 0
          ? 'All files uploaded successfully'
          : `${successfulUploads.length} files uploaded, ${failedUploads.length} failed`,
      data: {
        successful: successfulUploads.map((result) => result.data),
        failed: failedUploads.map((result) => result.message),
        total: files.length,
        successfulCount: successfulUploads.length,
        failedCount: failedUploads.length,
      },
    }
  } catch (error) {
    console.error('Multiple S3 Upload Error:', error)
    return {
      success: false,
      message: `Multiple upload failed: ${error.message}`,
      data: null,
    }
  }
}

/**
 * Generate a presigned (signed) URL for private S3 objects. Use when bucket is private.
 * @param {string} s3PathOrUrl - Full S3 URL (https://bucket.s3.region.amazonaws.com/key) or S3 key
 * @param {number} expiresIn - URL validity in seconds (default: 1 hour)
 * @returns {Promise<string|null>} Signed URL or null if not S3 / error
 */
export const getSignedUrlForPath = async (s3PathOrUrl, expiresIn = 3600) => {
  try {
    const bucketName = process.env.AWS_BUCKET_NAME
    if (!bucketName || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      return null
    }
    let key = s3PathOrUrl
    if (typeof s3PathOrUrl === 'string' && s3PathOrUrl.startsWith('http')) {
      const match = s3PathOrUrl.match(/\.amazonaws\.com\/(.+)$/)
      if (!match) return null
      key = decodeURIComponent(match[1])
    }
    if (!key || typeof key !== 'string') return null

    const command = new GetObjectCommand({ Bucket: bucketName, Key: key })
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn })
    return signedUrl
  } catch (err) {
    console.error('getSignedUrlForPath error:', err)
    return null
  }
}

export default {
  uploadToS3,
  uploadMultipleToS3,
  getSignedUrlForPath,
}
