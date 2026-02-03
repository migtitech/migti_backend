import {
  verifyToken,
  extractTokenFromHeader,
} from '../core/helpers/jwt.helper.js'
import { statusCodes, errorCodes } from '../core/common/constant.js'
import CustomError from '../utils/exception.js'

/**
 * JWT Authentication Middleware
 * Verifies JWT token and adds user info to request object
 */
export const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    const token = extractTokenFromHeader(authHeader)

    if (!token) {
      throw new CustomError(
        statusCodes.unauthorized,
        'Access token is required',
        errorCodes.missing_auth_token
      )
    }

    const decoded = verifyToken(token)

    // Add user info to request object
    req.user = decoded
    req.token = token

    next()
  } catch (error) {
    next(error)
  }
}

/**
 * Optional JWT Authentication Middleware
 * Verifies JWT token if present, but doesn't throw error if missing
 */
export const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    const token = extractTokenFromHeader(authHeader)

    if (token) {
      const decoded = verifyToken(token)
      req.user = decoded
      req.token = token
    }

    next()
  } catch (error) {
    // For optional auth, we don't throw error, just continue without user info
    next()
  }
}

/**
 * Role-based authorization middleware
 * @param {string|Array} allowedRoles - Role(s) that are allowed to access
 */
export const authorizeRoles = (allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new CustomError(
          statusCodes.unauthorized,
          'Authentication required',
          errorCodes.authentication_required
        )
      }

      const userRole = req.user.role
      const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]

      if (!roles.includes(userRole)) {
        throw new CustomError(
          statusCodes.forbidden,
          'Insufficient permissions',
          errorCodes.insufficient_permissions
        )
      }

      next()
    } catch (error) {
      next(error)
    }
  }
}

/**
 * SuperAdmin specific authorization middleware
 */
export const requireSuperAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      throw new CustomError(
        statusCodes.unauthorized,
        'Authentication required',
        errorCodes.authentication_required
      )
    }

    if (req.user.role !== 'superadmin') {
      throw new CustomError(
        statusCodes.forbidden,
        'SuperAdmin access required',
        errorCodes.insufficient_permissions
      )
    }

    next()
  } catch (error) {
    next(error)
  }
}

/**
 * Admin specific authorization middleware
 */
export const requireAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      throw new CustomError(
        statusCodes.unauthorized,
        'Authentication required',
        errorCodes.authentication_required
      )
    }

    if (!['admin', 'superadmin'].includes(req.user.role)) {
      throw new CustomError(
        statusCodes.forbidden,
        'Admin access required',
        errorCodes.insufficient_permissions
      )
    }

    next()
  } catch (error) {
    next(error)
  }
}
