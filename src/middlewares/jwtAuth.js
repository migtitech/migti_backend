import {
  verifyToken,
  extractTokenFromHeader,
} from '../core/helpers/jwt.helper.js'
import {
  statusCodes,
  errorCodes,
  FULL_ACCESS_ROLES,
  MODULES,
  PURCHASE_ORDER_BYPASS_ROLES,
} from '../core/common/constant.js'
import CustomError from '../utils/exception.js'

const normalizeRole = (role) =>
  String(role || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')

const hasPurchaseOrderBypass = (role) => {
  const normalized = normalizeRole(role)
  if (PURCHASE_ORDER_BYPASS_ROLES.includes(normalized)) return true
  return normalized.replace(/_/g, '').includes('backoffice')
}


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

    req.user = decoded
    req.token = token
    req.branchId = decoded.branchId || null

    next()
  } catch (error) {
    next(error)
  }
}


export const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    const token = extractTokenFromHeader(authHeader)

    if (token) {
      const decoded = verifyToken(token)
      req.user = decoded
      req.token = token
      req.branchId = decoded.branchId || null
    }

    next()
  } catch (error) {
    next()
  }
}


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

export const checkPermission = (module, action) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new CustomError(
          statusCodes.unauthorized,
          'Authentication required',
          errorCodes.authentication_required
        )
      }

      if (FULL_ACCESS_ROLES.includes(req.user.role)) {
        return next()
      }
      if (module === MODULES.PURCHASE_ORDERS && hasPurchaseOrderBypass(req.user.role)) {
        return next()
      }

      const requiredPermission = `${module}:${action}`
      const userPermissions = req.user.permissions || []

      if (!userPermissions.includes(requiredPermission)) {
        throw new CustomError(
          statusCodes.forbidden,
          `You do not have permission to ${action} ${module}`,
          errorCodes.insufficient_permissions
        )
      }

      next()
    } catch (error) {
      next(error)
    }
  }
}


export const checkPermissionAny = (module, actions) => {
  const actionsList = Array.isArray(actions) ? actions : [actions]
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new CustomError(
          statusCodes.unauthorized,
          'Authentication required',
          errorCodes.authentication_required
        )
      }
      if (FULL_ACCESS_ROLES.includes(req.user.role)) {
        return next()
      }
      const userPermissions = req.user.permissions || []
      const hasAny = actionsList.some(
        (action) => userPermissions.includes(`${module}:${action}`)
      )
      if (!hasAny) {
        throw new CustomError(
          statusCodes.forbidden,
          `You do not have permission to perform this action on ${module}`,
          errorCodes.insufficient_permissions
        )
      }
      next()
    } catch (error) {
      next(error)
    }
  }
}
