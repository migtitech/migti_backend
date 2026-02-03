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
var superAdminSchema = new _mongoose["default"].Schema({
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
superAdminSchema.plugin(_commonFieldsPlugin.commonFieldsPlugin);
var SuperAdminModel = _mongoose["default"].model('superadmin', superAdminSchema);
var _default = exports["default"] = SuperAdminModel;