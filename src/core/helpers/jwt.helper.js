import jwt from 'jsonwebtoken'
import 'dotenv/config'
import CustomError from '../../utils/exception.js'
import { statusCodes, errorCodes } from '../common/constant.js'

// JWT Configuration
const JWT_SECRET =
  process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h'
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d'

/**
 * Create JWT token with payload
 * @param {Object} payload - Data to be encoded in the token
 * @param {string} expiresIn - Token expiration time (optional, defaults to JWT_EXPIRES_IN)
 * @returns {string} JWT token
 */
export const createToken = (payload, expiresIn = JWT_EXPIRES_IN) => {
  try {
    if (!payload || typeof payload !== 'object') {
      throw new CustomError(
        statusCodes.badRequest,
        'Invalid payload for token creation',
        errorCodes.invalid_input
      )
    }

    return jwt.sign(payload, JWT_SECRET, {
      expiresIn,
      issuer: 'gca-backend',
      audience: 'gca-frontend',
    })
  } catch (error) {
    throw new CustomError(
      statusCodes.internalServerError,
      'Failed to create token',
      errorCodes.server_error
    )
  }
}

/**
 * Create refresh token with payload
 * @param {Object} payload - Data to be encoded in the refresh token
 * @returns {string} JWT refresh token
 */
export const createRefreshToken = (payload) => {
  try {
    if (!payload || typeof payload !== 'object') {
      throw new CustomError(
        statusCodes.badRequest,
        'Invalid payload for refresh token creation',
        errorCodes.invalid_input
      )
    }

    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_REFRESH_EXPIRES_IN,
      issuer: 'gca-backend',
      audience: 'gca-frontend',
    })
  } catch (error) {
    throw new CustomError(
      statusCodes.internalServerError,
      'Failed to create refresh token',
      errorCodes.server_error
    )
  }
}

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
export const verifyToken = (token) => {
  try {
    if (!token) {
      throw new CustomError(
        statusCodes.unauthorized,
        'Token is required',
        errorCodes.missing_auth_token
      )
    }

    // Remove 'Bearer ' prefix if present
    const cleanToken = token.replace(/^Bearer\s+/i, '')

    const decoded = jwt.verify(cleanToken, JWT_SECRET, {
      issuer: 'gca-backend',
      audience: 'gca-frontend',
    })

    return decoded
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new CustomError(
        statusCodes.unauthorized,
        'Token has expired',
        errorCodes.expired_token
      )
    } else if (error.name === 'JsonWebTokenError') {
      throw new CustomError(
        statusCodes.unauthorized,
        'Invalid token',
        errorCodes.invalid_token
      )
    } else if (error.name === 'NotBeforeError') {
      throw new CustomError(
        statusCodes.unauthorized,
        'Token not active',
        errorCodes.invalid_token
      )
    } else {
      throw new CustomError(
        statusCodes.unauthorized,
        'Token verification failed',
        errorCodes.invalid_token
      )
    }
  }
}

/**
 * Decode JWT token without verification (for debugging purposes)
 * @param {string} token - JWT token to decode
 * @returns {Object} Decoded token payload
 */
export const decodeToken = (token) => {
  try {
    if (!token) {
      throw new CustomError(
        statusCodes.badRequest,
        'Token is required',
        errorCodes.missing_auth_token
      )
    }

    const cleanToken = token.replace(/^Bearer\s+/i, '')
    return jwt.decode(cleanToken)
  } catch (error) {
    throw new CustomError(
      statusCodes.badRequest,
      'Failed to decode token',
      errorCodes.invalid_token
    )
  }
}

/**
 * Check if token is expired without throwing error
 * @param {string} token - JWT token to check
 * @returns {boolean} True if token is expired, false otherwise
 */
export const isTokenExpired = (token) => {
  try {
    const decoded = decodeToken(token)
    if (!decoded || !decoded.exp) {
      return true
    }

    const currentTime = Math.floor(Date.now() / 1000)
    return decoded.exp < currentTime
  } catch (error) {
    return true
  }
}

/**
 * Extract token from Authorization header
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} Extracted token or null
 */
export const extractTokenFromHeader = (authHeader) => {
  if (!authHeader) {
    return null
  }

  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null
  }

  return parts[1]
}

/**
 * Create token pair (access token and refresh token)
 * @param {Object} payload - Data to be encoded in the tokens
 * @returns {Object} Object containing accessToken and refreshToken
 */
export const createTokenPair = (payload) => {
  try {
    const accessToken = createToken(payload)
    const refreshToken = createRefreshToken(payload)

    return {
      accessToken,
      refreshToken,
      expiresIn: JWT_EXPIRES_IN,
      refreshExpiresIn: JWT_REFRESH_EXPIRES_IN,
    }
  } catch (error) {
    throw new CustomError(
      statusCodes.internalServerError,
      'Failed to create token pair',
      errorCodes.server_error
    )
  }
}

/**
 * Get token expiration time in seconds
 * @param {string} token - JWT token
 * @returns {number|null} Expiration time in seconds or null
 */
export const getTokenExpiration = (token) => {
  try {
    const decoded = decodeToken(token)
    return decoded?.exp || null
  } catch (error) {
    return null
  }
}

// Export JWT configuration for other modules
export const JWT_CONFIG = {
  secret: JWT_SECRET,
  expiresIn: JWT_EXPIRES_IN,
  refreshExpiresIn: JWT_REFRESH_EXPIRES_IN,
}
