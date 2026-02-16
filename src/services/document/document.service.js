import path from 'path'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'
import DocumentModel from '../../models/document.model.js'
import { uploadToS3 } from '../../core/helpers/s3bucket.js'

const ASSETS_DIR = path.join(process.cwd(), 'assets')

const isS3Configured = () =>
  !!(
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_BUCKET_NAME
  )

/**
 * Ensure directory exists (for local fallback).
 */
function ensureDir(dirPath) {
  const full = path.join(process.cwd(), dirPath)
  if (!fs.existsSync(full)) fs.mkdirSync(full, { recursive: true })
  return full
}

/**
 * Write memory buffers to assets/images/products/{timestamp} and create document records (local fallback).
 */
async function createDocumentsFromBuffersLocal(files) {
  if (!files?.length) return []
  const timestamp = Date.now()
  const dir = path.join('assets', 'images', 'products', String(timestamp))
  ensureDir(dir)
  const docs = []
  for (const file of files) {
    if (!file.buffer) continue
    const ext = path.extname(file.originalname) || '.jpg'
    const name = `${path.basename(file.originalname || 'file', ext).replace(/\s+/g, '-').slice(0, 40)}-${Date.now()}-${uuidv4().slice(0, 8)}${ext}`
    const filePath = path.join(dir, name)
    const fullPath = path.join(process.cwd(), filePath)
    fs.writeFileSync(fullPath, file.buffer)
    const relativePath = path.join('images', 'products', String(timestamp), name).split(path.sep).join('/')
    const doc = await DocumentModel.create({
      path: relativePath,
      originalName: file.originalname || '',
      mimeType: file.mimetype || '',
    })
    docs.push({ _id: doc._id, path: doc.path })
  }
  return docs
}

/**
 * Upload files to S3 (folder: images/products/{timestamp}) and create document records with URL in path.
 * Expects files from multer memory storage: { buffer, originalname, mimetype }.
 * @returns {Promise<Array<{ _id: ObjectId, path: string }>>} path is full S3 URL
 */
export const createDocumentsFromS3Uploads = async (files) => {
  if (!files?.length) return []
  const timestamp = Date.now()
  const folder = `images/products/${timestamp}`
  const bucketName = process.env.AWS_BUCKET_NAME
  const docs = []
  for (const file of files) {
    if (!file?.buffer) continue
    const result = await uploadToS3(file, bucketName, folder)
    if (!result.success || !result.data?.url) continue
    const doc = await DocumentModel.create({
      path: result.data.url,
      originalName: file.originalname || '',
      mimeType: file.mimetype || '',
    })
    docs.push({ _id: doc._id, path: doc.path })
  }
  return docs
}

/**
 * Create document records for files stored on disk (local assets). For multer disk storage.
 * @param {Array<{ path: string, originalname?: string, mimetype?: string }>} files - from multer req.files
 */
export const createDocumentsForFiles = async (files) => {
  if (!files?.length) return []
  const docs = []
  for (const file of files) {
    const relativePath = path.relative(ASSETS_DIR, file.path).split(path.sep).join('/')
    const doc = await DocumentModel.create({
      path: relativePath,
      originalName: file.originalname || '',
      mimeType: file.mimetype || '',
    })
    docs.push({ _id: doc._id, path: doc.path })
  }
  return docs
}

/**
 * Create documents from uploaded files. Uses S3 when configured (images/products/{timestamp}),
 * otherwise writes to assets/images/products/{timestamp} and stores relative path.
 * Accepts files from multer: either memory (buffer) or disk (path).
 */
export const createDocumentsForUploadedFiles = async (files) => {
  if (!files?.length) return []

  const withBuffers = files.filter((f) => f && Buffer.isBuffer(f.buffer))
  if (withBuffers.length > 0) {
    if (isS3Configured()) return createDocumentsFromS3Uploads(withBuffers)
    return createDocumentsFromBuffersLocal(withBuffers)
  }

  const withPaths = files.filter((f) => f && f.path)
  if (withPaths.length === files.length) return createDocumentsForFiles(files)

  return []
}

/**
 * Get document by id.
 */
export const getDocumentById = async (documentId) => {
  const doc = await DocumentModel.findById(documentId).lean()
  return doc
}
