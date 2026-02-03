import multer from 'multer'

// Memory storage for S3 uploads (no need to save to disk)
const storage = multer.memoryStorage()

// File filter function
const fileFilter = (req, file, cb) => {
  // Allow common file types including videos
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'video/mp4',
    'video/avi',
    'video/mov',
    'video/wmv',
    'video/flv',
    'video/webm',
    'video/mkv',
    'video/quicktime',
  ]

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error(`File type ${file.mimetype} not allowed`), false)
  }
}

// Multer configuration for single file upload
export const uploadSingle = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
})

// Multer configuration for multiple file upload
export const uploadMultiple = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
    files: 5, // Maximum 5 files
  },
})

// Multer configuration for chunked uploads (larger file size limit)
export const uploadChunk = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Only allow video files for chunked uploads
    const allowedVideoTypes = [
      'video/mp4',
      'video/avi',
      'video/mov',
      'video/wmv',
      'video/flv',
      'video/webm',
      'video/mkv',
      'video/quicktime'
    ]

    if (allowedVideoTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed for video uploads`), false)
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per chunk (5MB recommended, but allowing buffer)
  },
})

// Error handling middleware for multer
export const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 10MB',
        data: null,
      })
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum 5 files allowed',
        data: null,
      })
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected field name for file upload',
        data: null,
      })
    }
  }

  if (error.message.includes('File type')) {
    return res.status(400).json({
      success: false,
      message: error.message,
      data: null,
    })
  }

  next(error)
}
