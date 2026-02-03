"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.updateAdminSchema = exports.updateAdminAccessSchema = exports.loginAdminSchema = exports.listAdminSchema = exports.getAdminByIdSchema = exports.deleteAdminSchema = exports.createAdminSchema = void 0;
var _joi = _interopRequireDefault(require("joi"));
var createAdminSchema = exports.createAdminSchema = _joi["default"].object({
  name: _joi["default"].string().required().min(2).max(50),
  email: _joi["default"].string().email().required(),
  password: _joi["default"].string().required().min(6)
});
var updateAdminSchema = exports.updateAdminSchema = _joi["default"].object({
  adminId: _joi["default"].string().required().messages({
    'string.empty': 'Admin ID is required',
    'any.required': 'Admin ID is required'
  }),
  name: _joi["default"].string().min(2).max(50).optional(),
  email: _joi["default"].string().email().optional(),
  password: _joi["default"].string().min(6).optional()
});
var loginAdminSchema = exports.loginAdminSchema = _joi["default"].object({
  email: _joi["default"].string().email().required(),
  password: _joi["default"].string().required()
});
var listAdminSchema = exports.listAdminSchema = _joi["default"].object({
  pageNumber: _joi["default"].number().integer().min(1)["default"](1),
  pageSize: _joi["default"].number().integer().min(1).max(100)["default"](10)
});
var deleteAdminSchema = exports.deleteAdminSchema = _joi["default"].object({
  adminId: _joi["default"].string().required().messages({
    'string.empty': 'Admin ID is required',
    'any.required': 'Admin ID is required'
  })
});
var updateAdminAccessSchema = exports.updateAdminAccessSchema = _joi["default"].object({
  adminId: _joi["default"].string().required().messages({
    'string.empty': 'Admin ID is required',
    'any.required': 'Admin ID is required'
  }),
  access: _joi["default"].array().items(_joi["default"].string()).min(1).required().messages({
    'array.min': 'At least one access permission is required',
    'any.required': 'Access array is required'
  })
});
var getAdminByIdSchema = exports.getAdminByIdSchema = _joi["default"].object({
  adminId: _joi["default"].string().required().messages({
    'string.empty': 'Admin ID is required',
    'any.required': 'Admin ID is required'
  })
});