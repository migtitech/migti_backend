import multer from 'multer'

// Use memory storage so files have a buffer for direct S3 upload
const storage = multer.memoryStorage()

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-matroska',
  ]

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Only image, PDF, Word, and Excel files are allowed'), false)
  }
}

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 1024 * 1024 * 200 }, // 5 MB
})
