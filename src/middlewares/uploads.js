import multer from 'multer'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { ensureAssetsDir } from '../models/document.model.js'

const uploadsDir = 'uploads'

// Generic upload (existing): stores in uploads/
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir + '/')
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${file.fieldname}-${Date.now()}${ext}`)
  },
})

export const upload = multer({ storage })

// Assets upload: stores in assets/ with dynamic folders (product, variant).
// Query params: productId (optional), variantUniqueId (optional).
// Paths: assets/products/:productId/  or  assets/products/:productId/variants/:variantUniqueId/  or  assets/temp/
const getAssetsDestination = (req, file, cb) => {
  try {
    const productId = req.query.productId
    const variantUniqueId = req.query.variantUniqueId

    let dir
    if (productId) {
      if (variantUniqueId) {
        dir = path.join('assets', 'products', String(productId), 'variants', String(variantUniqueId))
      } else {
        dir = path.join('assets', 'products', String(productId))
      }
    } else {
      dir = path.join('assets', 'temp')
    }
    ensureAssetsDir(dir)
    cb(null, dir + path.sep)
  } catch (err) {
    cb(err)
  }
}

const getAssetsFilename = (req, file, cb) => {
  const ext = path.extname(file.originalname) || '.jpg'
  const base = path.basename(file.originalname, ext).replace(/\s+/g, '-').slice(0, 50)
  cb(null, `${base}-${Date.now()}-${uuidv4().slice(0, 8)}${ext}`)
}

const assetsStorage = multer.diskStorage({
  destination: getAssetsDestination,
  filename: getAssetsFilename,
})

const imageFilter = (_req, file, cb) => {
  const allowed = /^image\/(jpeg|jpg|png|gif|webp)$/i
  if (allowed.test(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Only image files (jpeg, png, gif, webp) are allowed'), false)
  }
}

export const uploadAssets = multer({
  storage: assetsStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
  fileFilter: imageFilter,
})

// Memory storage for S3 uploads (files have buffer; backend uploads to S3 and stores URL in documents table)
export const uploadAssetsMemory = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: imageFilter,
})
