import multer from 'multer'
import path from 'path'

const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/')
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${file.fieldname}-${Date.now()}${ext}`)
  },
})

const memoryStorage = multer.memoryStorage()

const imageFileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Only JPEG, PNG, WebP and GIF images are allowed'), false)
  }
}

export const upload = multer({ storage: diskStorage })

export const uploadS3 = multer({
  storage: memoryStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
})
