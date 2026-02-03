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
var adminSchema = new _mongoose["default"].Schema({
  uniqueId: {
    type: String,
    unique: true,
    "default": _uuid.v4
  },
  name: {
    type: _schemaTypes.SchemaTypes.String,
    required: true
  },
  email: {
    type: _schemaTypes.SchemaTypes.String,
    required: true,
    unique: true
  },
  password: {
    type: _schemaTypes.SchemaTypes.String,
    required: true
  }
}, {
  timestamps: true
});
adminSchema.plugin(_commonFieldsPlugin.commonFieldsPlugin);
var AdminModel = _mongoose["default"].model('admin', adminSchema);
var _default = exports["default"] = AdminModel;