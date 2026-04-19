"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.requireSuperAdmin = exports.requireAdmin = exports.optionalAuth = exports.checkPermissionAny = exports.checkPermission = exports.authorizeRoles = exports.authenticateToken = void 0;
var _jwtHelper = require("../core/helpers/jwt.helper.js");
var _constant = require("../core/common/constant.js");
var _exception = _interopRequireDefault(require("../utils/exception.js"));
var normalizeRole = function normalizeRole(role) {
  return String(role || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
};
var hasPurchaseOrderBypass = function hasPurchaseOrderBypass(role) {
  var normalized = normalizeRole(role);
  if (_constant.PURCHASE_ORDER_BYPASS_ROLES.includes(normalized)) return true;
  return normalized.replace(/_/g, '').includes('backoffice');
};
var authenticateToken = exports.authenticateToken = function authenticateToken(req, res, next) {
  try {
    var authHeader = req.headers.authorization;
    var token = (0, _jwtHelper.extractTokenFromHeader)(authHeader);
    if (!token) {
      throw new _exception["default"](_constant.statusCodes.unauthorized, 'Access token is required', _constant.errorCodes.missing_auth_token);
    }
    var decoded = (0, _jwtHelper.verifyToken)(token);
    req.user = decoded;
    req.token = token;
    req.branchId = decoded.branchId || null;
    next();
  } catch (error) {
    next(error);
  }
};
var optionalAuth = exports.optionalAuth = function optionalAuth(req, res, next) {
  try {
    var authHeader = req.headers.authorization;
    var token = (0, _jwtHelper.extractTokenFromHeader)(authHeader);
    if (token) {
      var decoded = (0, _jwtHelper.verifyToken)(token);
      req.user = decoded;
      req.token = token;
      req.branchId = decoded.branchId || null;
    }
    next();
  } catch (error) {
    next();
  }
};
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
var checkPermission = exports.checkPermission = function checkPermission(module, action) {
  return function (req, res, next) {
    try {
      if (!req.user) {
        throw new _exception["default"](_constant.statusCodes.unauthorized, 'Authentication required', _constant.errorCodes.authentication_required);
      }
      if (_constant.FULL_ACCESS_ROLES.includes(req.user.role)) {
        return next();
      }
      if (module === _constant.MODULES.PURCHASE_ORDERS && hasPurchaseOrderBypass(req.user.role)) {
        return next();
      }
      var requiredPermission = "".concat(module, ":").concat(action);
      var userPermissions = req.user.permissions || [];
      if (!userPermissions.includes(requiredPermission)) {
        throw new _exception["default"](_constant.statusCodes.forbidden, "You do not have permission to ".concat(action, " ").concat(module), _constant.errorCodes.insufficient_permissions);
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};
var checkPermissionAny = exports.checkPermissionAny = function checkPermissionAny(module, actions) {
  var actionsList = Array.isArray(actions) ? actions : [actions];
  return function (req, res, next) {
    try {
      if (!req.user) {
        throw new _exception["default"](_constant.statusCodes.unauthorized, 'Authentication required', _constant.errorCodes.authentication_required);
      }
      if (_constant.FULL_ACCESS_ROLES.includes(req.user.role)) {
        return next();
      }
      var userPermissions = req.user.permissions || [];
      var hasAny = actionsList.some(function (action) {
        return userPermissions.includes("".concat(module, ":").concat(action));
      });
      if (!hasAny) {
        throw new _exception["default"](_constant.statusCodes.forbidden, "You do not have permission to perform this action on ".concat(module), _constant.errorCodes.insufficient_permissions);
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};