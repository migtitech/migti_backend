"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.updateRoleSchema = exports.listRoleSchema = exports.getRoleByIdSchema = exports.deleteRoleSchema = exports.createRoleSchema = void 0;
var _joi = _interopRequireDefault(require("joi"));
var createRoleSchema = exports.createRoleSchema = _joi["default"].object({
  name: _joi["default"].string().required().min(2).max(50),
  description: _joi["default"].string().optional().allow(''),
  permissions: _joi["default"].array().items(_joi["default"].string()).min(1).required()
});
var listRoleSchema = exports.listRoleSchema = _joi["default"].object({
  page: _joi["default"].number().integer().min(1)["default"](1),
  limit: _joi["default"].number().integer().min(1).max(100)["default"](10),
  search: _joi["default"].string().allow('', null)
});
var getRoleByIdSchema = exports.getRoleByIdSchema = _joi["default"].object({
  roleId: _joi["default"].string().required()
});
var updateRoleSchema = exports.updateRoleSchema = _joi["default"].object({
  roleId: _joi["default"].string().required(),
  name: _joi["default"].string().min(2).max(50).optional(),
  description: _joi["default"].string().optional().allow(''),
  permissions: _joi["default"].array().items(_joi["default"].string()).min(1).optional()
});
var deleteRoleSchema = exports.deleteRoleSchema = _joi["default"].object({
  roleId: _joi["default"].string().required()
});