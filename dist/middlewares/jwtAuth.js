"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.requireSuperAdmin = exports.requireAdmin = exports.optionalAuth = exports.authorizeRoles = exports.authenticateToken = void 0;
var _jwtHelper = require("../core/helpers/jwt.helper.js");
var _constant = require("../core/common/constant.js");
var _exception = _interopRequireDefault(require("../utils/exception.js"));
/**
 * JWT Authentication Middleware
 * Verifies JWT token and adds user info to request object
 */
var authenticateToken = exports.authenticateToken = function authenticateToken(req, res, next) {
  try {
    var authHeader = req.headers.authorization;
    var token = (0, _jwtHelper.extractTokenFromHeader)(authHeader);
    if (!token) {
      throw new _exception["default"](_constant.statusCodes.unauthorized, 'Access token is required', _constant.errorCodes.missing_auth_token);
    }
    var decoded = (0, _jwtHelper.verifyToken)(token);

    // Add user info to request object
    req.user = decoded;
    req.token = token;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional JWT Authentication Middleware
 * Verifies JWT token if present, but doesn't throw error if missing
 */
var optionalAuth = exports.optionalAuth = function optionalAuth(req, res, next) {
  try {
    var authHeader = req.headers.authorization;
    var token = (0, _jwtHelper.extractTokenFromHeader)(authHeader);
    if (token) {
      var decoded = (0, _jwtHelper.verifyToken)(token);
      req.user = decoded;
      req.token = token;
    }
    next();
  } catch (error) {
    // For optional auth, we don't throw error, just continue without user info
    next();
  }
};

/**
 * Role-based authorization middleware
 * @param {string|Array} allowedRoles - Role(s) that are allowed to access
 */
var authorizeRoles = exports.authorizeRoles = function authorizeRoles(allowedRoles) {
  return function (req, res, next) {
    try {
      if (!req.user) {
        throw new _exception["default"](_constant.statusCodes.unauthorized, 'Authentication required', _constant.errorCodes.authentication_required);
      }
      var userRole = req.user.role;
      var roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
      if (!roles.includes(userRole)) {
        throw new _exception["default"](_constant.statusCodes.forbidden, 'Insufficient permissions', _constant.errorCodes.insufficient_permissions);
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * SuperAdmin specific authorization middleware
 */
var requireSuperAdmin = exports.requireSuperAdmin = function requireSuperAdmin(req, res, next) {
  try {
    if (!req.user) {
      throw new _exception["default"](_constant.statusCodes.unauthorized, 'Authentication required', _constant.errorCodes.authentication_required);
    }
    if (req.user.role !== 'superadmin') {
      throw new _exception["default"](_constant.statusCodes.forbidden, 'SuperAdmin access required', _constant.errorCodes.insufficient_permissions);
    }
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Admin specific authorization middleware
 */
var requireAdmin = exports.requireAdmin = function requireAdmin(req, res, next) {
  try {
    if (!req.user) {
      throw new _exception["default"](_constant.statusCodes.unauthorized, 'Authentication required', _constant.errorCodes.authentication_required);
    }
    if (!['admin', 'superadmin'].includes(req.user.role)) {
      throw new _exception["default"](_constant.statusCodes.forbidden, 'Admin access required', _constant.errorCodes.insufficient_permissions);
    }
    next();
  } catch (error) {
    next(error);
  }
};