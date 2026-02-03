import logger from '../core/config/logger.js'
import process from 'node:process'

const globalExceptionHandler = (err, req, res, next) => {
  const statusCode = err?.statusCode || 500
  const message = err?.message || 'Internal Server Error'
  const errorCode = err?.errorCode || 'UNKNOWN_ERROR'
  const errors = err?.errors || []
  const isOperational = err?.isOperational ?? false
  const stack = err?.stack || 'No stack trace available'

  // Log error with request context
  const { method, originalUrl, body, params, headers } = req
  const logMessage = `
[ERROR]
Method: ${method}
URL: ${originalUrl}
Params: ${JSON.stringify(params)}
Body: ${JSON.stringify(body)}
Headers: ${JSON.stringify(headers)}
Error Message: ${message}
Stack: ${stack}
  `
  logger.error(logMessage)

  // Format the response
  const formattedResponse = {
    success: false,
    message,
    data: null,
    error: {
      errorCode,
      detail: message,
    },
  }

  // ✅ Ensure res exists before using
  if (res && typeof res.status === 'function') {
    res.status(statusCode).json(formattedResponse)
  } else {
    console.error(
      'Invalid Express response object. Cannot send error response.'
    )
  }
}

export default globalExceptionHandler
