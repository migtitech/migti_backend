"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.verifyToken = exports.isTokenExpired = exports.getTokenExpiration = exports.extractTokenFromHeader = exports.decodeToken = exports.createTokenPair = exports.createToken = exports.createRefreshToken = exports.JWT_CONFIG = void 0;
var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));
var _jsonwebtoken = _interopRequireDefault(require("jsonwebtoken"));
require("dotenv/config");
var _exception = _interopRequireDefault(require("../../utils/exception.js"));
var _constant = require("../common/constant.js");
// JWT Configuration
var JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
var JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
var JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

/**
 * Create JWT token with payload
 * @param {Object} payload - Data to be encoded in the token
 * @param {string} expiresIn - Token expiration time (optional, defaults to JWT_EXPIRES_IN)
 * @returns {string} JWT token
 */
var createToken = exports.createToken = function createToken(payload) {
  var expiresIn = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : JWT_EXPIRES_IN;
  try {
    if (!payload || (0, _typeof2["default"])(payload) !== 'object') {
      throw new _exception["default"](_constant.statusCodes.badRequest, 'Invalid payload for token creation', _constant.errorCodes.invalid_input);
    }
    return _jsonwebtoken["default"].sign(payload, JWT_SECRET, {
      expiresIn: expiresIn,
      issuer: 'gca-backend',
      audience: 'gca-frontend'
    });
  } catch (error) {
    throw new _exception["default"](_constant.statusCodes.internalServerError, 'Failed to create token', _constant.errorCodes.server_error);
  }
};

/**
 * Create refresh token with payload
 * @param {Object} payload - Data to be encoded in the refresh token
 * @returns {string} JWT refresh token
 */
var createRefreshToken = exports.createRefreshToken = function createRefreshToken(payload) {
  try {
    if (!payload || (0, _typeof2["default"])(payload) !== 'object') {
      throw new _exception["default"](_constant.statusCodes.badRequest, 'Invalid payload for refresh token creation', _constant.errorCodes.invalid_input);
    }
    return _jsonwebtoken["default"].sign(payload, JWT_SECRET, {
      expiresIn: JWT_REFRESH_EXPIRES_IN,
      issuer: 'gca-backend',
      audience: 'gca-frontend'
    });
  } catch (error) {
    throw new _exception["default"](_constant.statusCodes.internalServerError, 'Failed to create refresh token', _constant.errorCodes.server_error);
  }
};

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
var verifyToken = exports.verifyToken = function verifyToken(token) {
  try {
    if (!token) {
      throw new _exception["default"](_constant.statusCodes.unauthorized, 'Token is required', _constant.errorCodes.missing_auth_token);
    }

    // Remove 'Bearer ' prefix if present
    var cleanToken = token.replace(/^Bearer\s+/i, '');
    var decoded = _jsonwebtoken["default"].verify(cleanToken, JWT_SECRET, {
      issuer: 'gca-backend',
      audience: 'gca-frontend'
    });
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new _exception["default"](_constant.statusCodes.unauthorized, 'Token has expired', _constant.errorCodes.expired_token);
    } else if (error.name === 'JsonWebTokenError') {
      throw new _exception["default"](_constant.statusCodes.unauthorized, 'Invalid token', _constant.errorCodes.invalid_token);
    } else if (error.name === 'NotBeforeError') {
      throw new _exception["default"](_constant.statusCodes.unauthorized, 'Token not active', _constant.errorCodes.invalid_token);
    } else {
      throw new _exception["default"](_constant.statusCodes.unauthorized, 'Token verification failed', _constant.errorCodes.invalid_token);
    }
  }
};

/**
 * Decode JWT token without verification (for debugging purposes)
 * @param {string} token - JWT token to decode
 * @returns {Object} Decoded token payload
 */
var decodeToken = exports.decodeToken = function decodeToken(token) {
  try {
    if (!token) {
      throw new _exception["default"](_constant.statusCodes.badRequest, 'Token is required', _constant.errorCodes.missing_auth_token);
    }
    var cleanToken = token.replace(/^Bearer\s+/i, '');
    return _jsonwebtoken["default"].decode(cleanToken);
  } catch (error) {
    throw new _exception["default"](_constant.statusCodes.badRequest, 'Failed to decode token', _constant.errorCodes.invalid_token);
  }
};

/**
 * Check if token is expired without throwing error
 * @param {string} token - JWT token to check
 * @returns {boolean} True if token is expired, false otherwise
 */
var isTokenExpired = exports.isTokenExpired = function isTokenExpired(token) {
  try {
    var decoded = decodeToken(token);
    if (!decoded || !decoded.exp) {
      return true;
    }
    var currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch (error) {
    return true;
  }
};

/**
 * Extract token from Authorization header
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} Extracted token or null
 */
var extractTokenFromHeader = exports.extractTokenFromHeader = function extractTokenFromHeader(authHeader) {
  if (!authHeader) {
    return null;
  }
  var parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  return parts[1];
};

/**
 * Create token pair (access token and refresh token)
 * @param {Object} payload - Data to be encoded in the tokens
 * @returns {Object} Object containing accessToken and refreshToken
 */
var createTokenPair = exports.createTokenPair = function createTokenPair(payload) {
  try {
    var accessToken = createToken(payload);
    var refreshToken = createRefreshToken(payload);
    return {
      accessToken: accessToken,
      refreshToken: refreshToken,
      expiresIn: JWT_EXPIRES_IN,
      refreshExpiresIn: JWT_REFRESH_EXPIRES_IN
    };
  } catch (error) {
    throw new _exception["default"](_constant.statusCodes.internalServerError, 'Failed to create token pair', _constant.errorCodes.server_error);
  }
};

/**
 * Get token expiration time in seconds
 * @param {string} token - JWT token
 * @returns {number|null} Expiration time in seconds or null
 */
var getTokenExpiration = exports.getTokenExpiration = function getTokenExpiration(token) {
  try {
    var decoded = decodeToken(token);
    return (decoded === null || decoded === void 0 ? void 0 : decoded.exp) || null;
  } catch (error) {
    return null;
  }
};

// Export JWT configuration for other modules
var JWT_CONFIG = exports.JWT_CONFIG = {
  secret: JWT_SECRET,
  expiresIn: JWT_EXPIRES_IN,
  refreshExpiresIn: JWT_REFRESH_EXPIRES_IN
};