"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _mongoose = _interopRequireDefault(require("mongoose"));
var _uuid = require("uuid");
var _commonFieldsPlugin = require("./plugin/commonFields.plugin.js");
var _schemaTypes = require("../core/common/schemaTypes.js");
var roleSchema = new _mongoose["default"].Schema({
  uniqueId: {
    type: String,
    unique: true,
    "default": _uuid.v4
  },
  name: {
    type: _schemaTypes.SchemaTypes.String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: _schemaTypes.SchemaTypes.String,
    "default": ''
  },
  permissions: [{
    type: _schemaTypes.SchemaTypes.String,
    required: true
  }]
}, {
  timestamps: true
});
roleSchema.plugin(_commonFieldsPlugin.commonFieldsPlugin);
var RoleModel = _mongoose["default"].model('roles', roleSchema);
var _default = exports["default"] = RoleModel;