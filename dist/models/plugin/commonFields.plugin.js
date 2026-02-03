"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.commonFieldsPlugin = void 0;
var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));
var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));
var commonFieldsPlugin = exports.commonFieldsPlugin = function commonFieldsPlugin(schema) {
  schema.add({
    isActive: {
      type: Boolean,
      "default": true
    },
    isDeleted: {
      type: Boolean,
      "default": false
    }
  });
  schema.query.notDeleted = function () {
    return this.where({
      isDeleted: false
    });
  };
  schema.methods.softDelete = /*#__PURE__*/(0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee() {
    return _regenerator["default"].wrap(function (_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          this.isDeleted = true;
          _context.next = 1;
          return this.save();
        case 1:
          return _context.abrupt("return", _context.sent);
        case 2:
        case "end":
          return _context.stop();
      }
    }, _callee, this);
  }));
  schema.methods.notArchive = /*#__PURE__*/(0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee2() {
    return _regenerator["default"].wrap(function (_context2) {
      while (1) switch (_context2.prev = _context2.next) {
        case 0:
          this.archive = false;
          _context2.next = 1;
          return this.save();
        case 1:
          return _context2.abrupt("return", _context2.sent);
        case 2:
        case "end":
          return _context2.stop();
      }
    }, _callee2, this);
  }));
};