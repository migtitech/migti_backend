"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.requireSuperAdmin = exports.requireAdmin = exports.optionalAuth = exports.checkPermissionAny = exports.checkPermission = exports.authorizeRoles = exports.authenticateToken = void 0;
var _jwtHelper = require("../core/helpers/jwt.helper.js");
var _constant = require("../core/common/constant.js");
var _exception = _interopRequireDefault(require("../utils/exception.js"));
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
var authorizeRoles = exports.authorizeRoles = function authorizeRoles(_allowedRoles) {
  return function (req, res, next) {
    next();
  };
};
var requireSuperAdmin = exports.requireSuperAdmin = function requireSuperAdmin(req, res, next) {
  next();
};
var requireAdmin = exports.requireAdmin = function requireAdmin(req, res, next) {
  next();
};
var checkPermission = exports.checkPermission = function checkPermission(_module, _action) {
  return function (req, res, next) {
    next();
  };
};
var checkPermissionAny = exports.checkPermissionAny = function checkPermissionAny(_module, _actions) {
  return function (req, res, next) {
    next();
  };
};