"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createReferenceField = exports.SchemaTypes = exports.CommonFields = void 0;
var _mongoose = _interopRequireDefault(require("mongoose"));
// Common Schema Types
var SchemaTypes = exports.SchemaTypes = Object.freeze({
  ObjectId: _mongoose["default"].Schema.Types.ObjectId,
  String: String,
  Number: Number,
  Date: Date,
  Boolean: Boolean,
  Array: Array,
  Mixed: _mongoose["default"].Schema.Types.Mixed
});

// Common Schema Field Definitions
var CommonFields = exports.CommonFields = Object.freeze({
  uniqueId: {
    type: String,
    unique: true,
    "default": function _default() {
      return require('uuid').v4();
    }
  },
  createdAt: {
    type: Date,
    "default": Date.now
  },
  updatedAt: {
    type: Date,
    "default": Date.now
  },
  isActive: {
    type: Boolean,
    "default": true
  },
  isDeleted: {
    type: Boolean,
    "default": false
  }
});
var createReferenceField = exports.createReferenceField = function createReferenceField(refModel) {
  var required = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
  return {
    type: SchemaTypes.ObjectId,
    ref: refModel,
    required: required
  };
};