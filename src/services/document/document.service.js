import path from 'path'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'
import DocumentModel from '../../models/document.model.js'
import { uploadToS3, getSignedUrlForPath } from '../../core/helpers/s3bucket.js'

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

/**
 * Convert S3 paths to signed URLs for private bucket access.
 * Local paths are returned as-is.
 * @param {string} docPath - path from document (S3 URL or local relative path)
 * @returns {Promise<string>} signed URL for S3, or original path for local
 */
export const toDisplayPath = async (docPath) => {
  if (!docPath) return docPath
  if (typeof docPath === 'string' && (docPath.startsWith('http://') || docPath.startsWith('https://'))) {
    const signed = await getSignedUrlForPath(docPath)
    return signed || docPath
  }
  return docPath
}

/**
 * Transform documents array: replace S3 paths with signed URLs.
 * @param {Array<{_id, path}>} docs - documents with path
 * @returns {Promise<Array>} same docs with path replaced by signed URL when S3
 */
export const transformPathsToSignedUrls = async (docs) => {
  if (!docs?.length) return docs
  const result = []
  for (const d of docs) {
    const displayPath = await toDisplayPath(d?.path)
    result.push({ ...d, path: displayPath })
  }
  return result
}

/**
 * Transform product(s) images paths to signed URLs for S3 private bucket.
 * Handles product.images and product.variantCombinations[].images
 */
export const transformProductImagesToSigned = async (productOrProducts) => {
  const transformDoc = async (doc) => {
    if (!doc?.path) return doc
    const displayPath = await toDisplayPath(doc.path)
    return { ...doc, path: displayPath }
  }
  const transformOne = async (p) => {
    if (!p) return p
    const out = { ...p }
    if (Array.isArray(out.images) && out.images.length) {
      out.images = await Promise.all(out.images.map(transformDoc))
    }
    if (Array.isArray(out.variantCombinations)) {
      out.variantCombinations = await Promise.all(
        out.variantCombinations.map(async (vc) => {
          if (!vc?.images?.length) return vc
          return { ...vc, images: await Promise.all(vc.images.map(transformDoc)) }
        })
      )
    }
    return out
  }
  if (Array.isArray(productOrProducts)) {
    return Promise.all(productOrProducts.map(transformOne))
  }
  return transformOne(productOrProducts)
}

/**
 * Add logoDisplayUrl (signed URL) to company for display. Keeps logoUrl as permanent for DB/form.
 */
export const addLogoDisplayUrl = async (company) => {
  if (!company?.logoUrl) return company
  const displayUrl = await toDisplayPath(company.logoUrl)
  return { ...company, logoDisplayUrl: displayUrl }
}

/**
 * Add logoDisplayUrl to companies array.
 */
export const addLogoDisplayUrlToCompanies = async (companies) => {
  if (!companies?.length) return companies
  return Promise.all(companies.map(addLogoDisplayUrl))
}
