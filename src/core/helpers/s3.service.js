import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import { S3_CONFIG } from '../config/s3.config.js'
import logger from '../config/logger.js'

const s3Client = new S3Client({
  region: S3_CONFIG.region,
  credentials: S3_CONFIG.credentials.accessKeyId
    ? {
        accessKeyId: S3_CONFIG.credentials.accessKeyId,
        secretAccessKey: S3_CONFIG.credentials.secretAccessKey,
      }
    : undefined,
})

const getBucket = () => S3_CONFIG.bucket

/**
 * Generate public S3 URI for an object
 * @param {string} key - S3 object key
 * @returns {string}
 */
export const getPublicUri = (key) => {
  const bucket = getBucket()
  const region = S3_CONFIG.region
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`
}

/**
 * Generate a signed URL for private bucket access
 * @param {string} key - S3 object key
 * @param {number} [expiresIn] - Expiry in seconds (default from S3_SIGNED_URL_EXPIRY)
 * @returns {Promise<string>}
 */
export const getSignedUrlForKey = async (key, expiresIn = S3_CONFIG.signedUrlExpirySeconds) => {
  if (!S3_CONFIG.isConfigured) {
    throw new Error('AWS S3 is not configured')
  }

  const command = new GetObjectCommand({
    Bucket: getBucket(),
    Key: key,
  })

  const signedUrl = await getSignedUrl(s3Client, command, { expiresIn })
  return signedUrl
}

/**
 * Upload a file to S3
 * @param {Object} file - Multer file object (must have buffer, originalname, mimetype)
 * @param {string} folderPath - Folder path in bucket (e.g. 'products', 'users')
 * @returns {Promise<{ url: string, key: string, signedUrl: string }>}
 */
export const uploadFile = async (file, folderPath = 'general') => {
  if (!S3_CONFIG.isConfigured) {
    throw new Error('AWS S3 is not configured. Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_S3_BUCKET.')
  }

  if (!file || !file.buffer) {
    throw new Error('File buffer is required for S3 upload')
  }

  const bucket = getBucket()
  const fileExtension = path.extname(file.originalname || '')
  const fileName = `${uuidv4()}${fileExtension}`
  const key = folderPath ? `${folderPath}/${fileName}` : fileName

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype || 'application/octet-stream',
  })

  await s3Client.send(command)

  const url = getPublicUri(key)
  const signedUrl = await getSignedUrlForKey(key)

  logger.info(`S3 upload completed: ${key}`)

  return { url, key, signedUrl }
}

/**
 * Delete a file from S3
 * @param {string} fileKey - S3 object key
 * @returns {Promise<void>}
 */
export const deleteFile = async (fileKey) => {
  if (!S3_CONFIG.isConfigured) {
    throw new Error('AWS S3 is not configured')
  }

  if (!fileKey || typeof fileKey !== 'string') {
    throw new Error('Valid file key is required for S3 delete')
  }

  const command = new DeleteObjectCommand({
    Bucket: getBucket(),
    Key: fileKey,
  })

  await s3Client.send(command)

  logger.info(`S3 delete completed: ${fileKey}`)
}

/**
 * Upload multiple files in parallel
 * @param {Object[]} files - Array of Multer file objects
 * @param {string} folderPath - Folder path in bucket
 * @returns {Promise<Array<{ url: string, key: string, signedUrl: string }>>}
 */
export const uploadFiles = async (files, folderPath = 'general') => {
  if (!files || !Array.isArray(files) || files.length === 0) {
    return []
  }

  const uploadPromises = files.map((file) => uploadFile(file, folderPath))
  return Promise.all(uploadPromises)
}

export default {
  uploadFile,
  uploadFiles,
  deleteFile,
  getPublicUri,
  getSignedUrlForKey,
  isConfigured: () => S3_CONFIG.isConfigured,
}
