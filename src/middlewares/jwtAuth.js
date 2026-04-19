import {
  verifyToken,
  extractTokenFromHeader,
} from '../core/helpers/jwt.helper.js'
import {
  statusCodes,
  errorCodes,
} from '../core/common/constant.js'
import CustomError from '../utils/exception.js'


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


export const authorizeRoles = (_allowedRoles) => {
  return (req, res, next) => {
    next()
  }
}

export const requireSuperAdmin = (req, res, next) => {
  next()
}

export const requireAdmin = (req, res, next) => {
  next()
}

export const checkPermission = (_module, _action) => {
  return (req, res, next) => {
    next()
  }
}


export const checkPermissionAny = (_module, _actions) => {
  return (req, res, next) => {
    next()
  }
}
