"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.updateRoleController = exports.listRolesController = exports.getRoleByIdController = exports.deleteRoleController = exports.createRoleController = void 0;
var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));
var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));
var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));
var _constant = require("../../core/common/constant.js");
var _roleValidator = require("../../validator/admin/role.validator.js");
var _roleService = require("../../services/admin/role.service.js");
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { (0, _defineProperty2["default"])(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
var createRoleController = exports.createRoleController = /*#__PURE__*/function () {
  var _ref = (0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee(req, res) {
    var _createRoleSchema$val, error, value, result;
    return _regenerator["default"].wrap(function (_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          _createRoleSchema$val = _roleValidator.createRoleSchema.validate(req.body, {
            abortEarly: false
          }), error = _createRoleSchema$val.error, value = _createRoleSchema$val.value;
          if (!error) {
            _context.next = 1;
            break;
          }
          return _context.abrupt("return", res.status(_constant.statusCodes.badRequest).json({
            success: false,
            message: _constant.Message.validationError,
            error: error.details.map(function (d) {
              return d.message;
            })
          }));
        case 1:
          _context.next = 2;
          return (0, _roleService.addRole)(value);
        case 2:
          result = _context.sent;
          return _context.abrupt("return", res.status(_constant.statusCodes.ok).json({
            success: true,
            message: 'Role created successfully',
            data: result
          }));
        case 3:
        case "end":
          return _context.stop();
      }
    }, _callee);
  }));
  return function createRoleController(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();
var listRolesController = exports.listRolesController = /*#__PURE__*/function () {
  var _ref2 = (0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee2(req, res) {
    var _listRoleSchema$valid, error, value, result;
    return _regenerator["default"].wrap(function (_context2) {
      while (1) switch (_context2.prev = _context2.next) {
        case 0:
          _listRoleSchema$valid = _roleValidator.listRoleSchema.validate(req.query, {
            abortEarly: false
          }), error = _listRoleSchema$valid.error, value = _listRoleSchema$valid.value;
          if (!error) {
            _context2.next = 1;
            break;
          }
          return _context2.abrupt("return", res.status(_constant.statusCodes.badRequest).json({
            success: false,
            message: _constant.Message.validationError,
            error: error.details.map(function (d) {
              return d.message;
            })
          }));
        case 1:
          _context2.next = 2;
          return (0, _roleService.listRoles)(value.page, value.limit, value.search);
        case 2:
          result = _context2.sent;
          return _context2.abrupt("return", res.status(_constant.statusCodes.ok).json({
            success: true,
            message: 'Roles retrieved successfully',
            data: result
          }));
        case 3:
        case "end":
          return _context2.stop();
      }
    }, _callee2);
  }));
  return function listRolesController(_x3, _x4) {
    return _ref2.apply(this, arguments);
  };
}();
var getRoleByIdController = exports.getRoleByIdController = /*#__PURE__*/function () {
  var _ref3 = (0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee3(req, res) {
    var _getRoleByIdSchema$va, error, value, result;
    return _regenerator["default"].wrap(function (_context3) {
      while (1) switch (_context3.prev = _context3.next) {
        case 0:
          _getRoleByIdSchema$va = _roleValidator.getRoleByIdSchema.validate(req.query, {
            abortEarly: false
          }), error = _getRoleByIdSchema$va.error, value = _getRoleByIdSchema$va.value;
          if (!error) {
            _context3.next = 1;
            break;
          }
          return _context3.abrupt("return", res.status(_constant.statusCodes.badRequest).json({
            success: false,
            message: _constant.Message.validationError,
            error: error.details.map(function (d) {
              return d.message;
            })
          }));
        case 1:
          _context3.next = 2;
          return (0, _roleService.getRoleById)(value);
        case 2:
          result = _context3.sent;
          return _context3.abrupt("return", res.status(_constant.statusCodes.ok).json({
            success: true,
            message: 'Role details retrieved successfully',
            data: result
          }));
        case 3:
        case "end":
          return _context3.stop();
      }
    }, _callee3);
  }));
  return function getRoleByIdController(_x5, _x6) {
    return _ref3.apply(this, arguments);
  };
}();
var updateRoleController = exports.updateRoleController = /*#__PURE__*/function () {
  var _ref4 = (0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee4(req, res) {
    var _updateRoleSchema$val, error, value, result;
    return _regenerator["default"].wrap(function (_context4) {
      while (1) switch (_context4.prev = _context4.next) {
        case 0:
          _updateRoleSchema$val = _roleValidator.updateRoleSchema.validate(_objectSpread(_objectSpread({}, req.body), req.query), {
            abortEarly: false
          }), error = _updateRoleSchema$val.error, value = _updateRoleSchema$val.value;
          if (!error) {
            _context4.next = 1;
            break;
          }
          return _context4.abrupt("return", res.status(_constant.statusCodes.badRequest).json({
            success: false,
            message: _constant.Message.validationError,
            error: error.details.map(function (d) {
              return d.message;
            })
          }));
        case 1:
          _context4.next = 2;
          return (0, _roleService.updateRole)(value);
        case 2:
          result = _context4.sent;
          return _context4.abrupt("return", res.status(_constant.statusCodes.ok).json({
            success: true,
            message: 'Role updated successfully',
            data: result
          }));
        case 3:
        case "end":
          return _context4.stop();
      }
    }, _callee4);
  }));
  return function updateRoleController(_x7, _x8) {
    return _ref4.apply(this, arguments);
  };
}();
var deleteRoleController = exports.deleteRoleController = /*#__PURE__*/function () {
  var _ref5 = (0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee5(req, res) {
    var _deleteRoleSchema$val, error, value, result;
    return _regenerator["default"].wrap(function (_context5) {
      while (1) switch (_context5.prev = _context5.next) {
        case 0:
          _deleteRoleSchema$val = _roleValidator.deleteRoleSchema.validate(req.query, {
            abortEarly: false
          }), error = _deleteRoleSchema$val.error, value = _deleteRoleSchema$val.value;
          if (!error) {
            _context5.next = 1;
            break;
          }
          return _context5.abrupt("return", res.status(_constant.statusCodes.badRequest).json({
            success: false,
            message: _constant.Message.validationError,
            error: error.details.map(function (d) {
              return d.message;
            })
          }));
        case 1:
          _context5.next = 2;
          return (0, _roleService.deleteRole)(value);
        case 2:
          result = _context5.sent;
          return _context5.abrupt("return", res.status(_constant.statusCodes.ok).json({
            success: true,
            message: 'Role deleted successfully',
            data: result
          }));
        case 3:
        case "end":
          return _context5.stop();
      }
    }, _callee5);
  }));
  return function deleteRoleController(_x9, _x0) {
    return _ref5.apply(this, arguments);
  };
}();