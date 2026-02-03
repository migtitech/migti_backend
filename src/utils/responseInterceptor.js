import { Message } from '../core/common/constant.js'
import logger from '../core/config/logger.js'
import process from 'node:process'

// Function to sanitize sensitive data
const sanitizeData = (data) => {
  if (!data) return data

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeData(item))
  }

  // Handle non-objects
  if (typeof data !== 'object') return data

  const sanitized = { ...data }

  // Remove sensitive fields
  delete sanitized.password
  delete sanitized.__v
  delete sanitized.createdAt
  delete sanitized.updatedAt

  // Convert _id to id for better API consistency
  if (sanitized._id) {
    sanitized.id = sanitized._id
    delete sanitized._id
  }

  // Add default role if not present (only for user objects)
  if (!sanitized.role && sanitized.email) {
    sanitized.role = 'SUPER_ADMIN'
  }

  return sanitized
}

const responseInterceptor = (req, res, next) => {
  const oldSend = res.json

  res.json = (data) => {
    let formattedResponse

    // If response is an instance of Error or CustomError, treat as error
    if (data instanceof Error || data?.errorCode || data?.statusCode >= 400) {
      formattedResponse = {
        success: data.success !== undefined ? data.success : false,
        message: data.message || 'An error occurred',
        data: null,
        error: {
          errorCode: data.errorCode || 'UNKNOWN_ERROR',
          detail: data.message || 'An error occurred',
        },
      }

      logger.error(
        `Error Response for [${req.method} ${req.originalUrl}]:\n${JSON.stringify(formattedResponse, null, 2)}`
      )
      return oldSend.call(res, formattedResponse)
    }

    // If response already has the correct format (from service layer), use it as is
    if (
      data?.message &&
      (data?.data !== undefined || data?.error !== undefined) &&
      !data?.errorCode
    ) {
      formattedResponse = {
        success: data.success !== undefined ? data.success : true,
        message: data.message,
        data: sanitizeData(data.data),
        error: data.error,
      }
      // Logging removed for development
      return oldSend.call(res, formattedResponse)
    }

    // If validation error
    if (data?.message === Message.validationError) {
      formattedResponse = {
        success: false,
        message: data.message || 'Validation error',
        data: null,
        error: {
          errorCode: 'VALIDATION_ERROR',
          detail: data.details || [],
        },
      }
    } else {
      // Standard success case - format the response properly
      formattedResponse = {
        success: data?.success !== undefined ? data.success : true,
        message: data?.message || 'Success',
        data: sanitizeData(data?.data || data || {}),
        error: null,
      }
    }

    // Logging removed for development
    oldSend.call(res, formattedResponse)
  }

  res.error = (error, statusCode = 500, message = 'Internal Server Error') => {
    const formattedResponse = {
      success: false,
      message,
      data: null,
      error: {
        errorCode: error?.errorCode || 'UNKNOWN_ERROR',
        detail: error?.message || message,
      },
    }

    logger.error(
      `Error Response for [${req.method} ${req.originalUrl}]:\n${JSON.stringify(formattedResponse, null, 2)}`
    )
    res.status(statusCode).json(formattedResponse)
  }

  next()
}

export default responseInterceptor
