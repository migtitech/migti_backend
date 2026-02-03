"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.userAuth = exports.superAdminAuth = exports.employeeAuth = exports.adminAuth = void 0;
var _jsonwebtoken = _interopRequireDefault(require("jsonwebtoken"));
var _exception = _interopRequireDefault(require("../utils/exception.js"));
var _constant = require("../core/common/constant.js");
require("dotenv/config");
var userAuth = exports.userAuth = function userAuth(req, res, next) {
  var _ref = (req === null || req === void 0 ? void 0 : req.headers) || {},
    authorization = _ref.authorization;
  var token = authorization && authorization.split(' ')[1];
  var verifyToken = 'JWT_SECRET';
  if (!token) {
    return new _exception["default"](_constant.statusCodes === null || _constant.statusCodes === void 0 ? void 0 : _constant.statusCodes.unauthorized, _constant.Message === null || _constant.Message === void 0 ? void 0 : _constant.Message.notFound, _constant.errorCodes === null || _constant.errorCodes === void 0 ? void 0 : _constant.errorCodes.missing_auth_token);
  }
  _jsonwebtoken["default"].verify(token, verifyToken, function (err, user) {
    if (err) {
      return new _exception["default"](_constant.statusCodes === null || _constant.statusCodes === void 0 ? void 0 : _constant.statusCodes.unauthorized, _constant.Message === null || _constant.Message === void 0 ? void 0 : _constant.Message.inValid, _constant.errorCodes === null || _constant.errorCodes === void 0 ? void 0 : _constant.errorCodes.invalid_authentication);
    }
    req.user = user === null || user === void 0 ? void 0 : user.payload; //attach decoded user data in req
    next();
  });
};
var superAdminAuth = exports.superAdminAuth = function superAdminAuth(req, res, next) {
  var _ref2 = (req === null || req === void 0 ? void 0 : req.user) || {},
    role = _ref2.role;
  if (role !== (_constant.checkRole === null || _constant.checkRole === void 0 ? void 0 : _constant.checkRole.superAdmin)) {
    return new _exception["default"](_constant.statusCodes === null || _constant.statusCodes === void 0 ? void 0 : _constant.statusCodes.unauthorized, _constant.Message === null || _constant.Message === void 0 ? void 0 : _constant.Message.inValid, _constant.errorCodes === null || _constant.errorCodes === void 0 ? void 0 : _constant.errorCodes.access_denied);
  }
  next();
};
var adminAuth = exports.adminAuth = function adminAuth(req, res, next) {
  var _ref3 = (req === null || req === void 0 ? void 0 : req.user) || {},
    role = _ref3.role;
  if (role !== (_constant.checkRole === null || _constant.checkRole === void 0 ? void 0 : _constant.checkRole.admin) && role !== (_constant.checkRole === null || _constant.checkRole === void 0 ? void 0 : _constant.checkRole.superAdmin)) {
    return new _exception["default"](_constant.statusCodes === null || _constant.statusCodes === void 0 ? void 0 : _constant.statusCodes.unauthorized, _constant.Message === null || _constant.Message === void 0 ? void 0 : _constant.Message.inValid, _constant.errorCodes === null || _constant.errorCodes === void 0 ? void 0 : _constant.errorCodes.access_denied);
  }
  next();
};
var employeeAuth = exports.employeeAuth = function employeeAuth(req, res, next) {
  var _ref4 = (req === null || req === void 0 ? void 0 : req.user) || {},
    role = _ref4.role;
  if (role !== (_constant.checkRole === null || _constant.checkRole === void 0 ? void 0 : _constant.checkRole.superAdmin) && role !== (_constant.checkRole === null || _constant.checkRole === void 0 ? void 0 : _constant.checkRole.admin) && role !== (_constant.checkRole === null || _constant.checkRole === void 0 ? void 0 : _constant.checkRole.hr) && role !== (_constant.checkRole === null || _constant.checkRole === void 0 ? void 0 : _constant.checkRole.guard) && role !== (_constant.checkRole === null || _constant.checkRole === void 0 ? void 0 : _constant.checkRole.security) && role !== (_constant.checkRole === null || _constant.checkRole === void 0 ? void 0 : _constant.checkRole.receptionist)) {
    return new _exception["default"](_constant.statusCodes === null || _constant.statusCodes === void 0 ? void 0 : _constant.statusCodes.unauthorized, _constant.Message === null || _constant.Message === void 0 ? void 0 : _constant.Message.inValid, _constant.errorCodes === null || _constant.errorCodes === void 0 ? void 0 : _constant.errorCodes.access_denied);
  }
  next();
};