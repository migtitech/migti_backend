"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.updateAdminAccessController = exports.updateAdmin = exports.loginAdmin = exports.listAdmin = exports.getAdminByIdController = exports.deleteAdminController = exports.createAdmin = void 0;
var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));
var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));
var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));
var _constant = require("../../core/common/constant.js");
var _adminValidator = require("../../validator/admin/admin.validator.js");
var _adminService = require("../../services/admin/admin.service.js");
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { (0, _defineProperty2["default"])(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
var loginAdmin = exports.loginAdmin = /*#__PURE__*/function () {
  var _ref = (0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee(req, res) {
    var _loginAdminSchema$val, error, value, result;
    return _regenerator["default"].wrap(function (_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          _loginAdminSchema$val = _adminValidator.loginAdminSchema.validate(req.body, {
            abortEarly: false
          }), error = _loginAdminSchema$val.error, value = _loginAdminSchema$val.value;
          if (!error) {
            _context.next = 1;
            break;
          }
          return _context.abrupt("return", res.status(_constant.statusCodes.badRequest).json({
            success: false,
            message: _constant.Message.validationError,
            data: null,
            error: {
              errorCode: 'VALIDATION_ERROR',
              detail: error.details.map(function (d) {
                return d.message;
              })
            }
          }));
        case 1:
          console.log('value', value);
          _context.next = 2;
          return (0, _adminService.adminLogin)(value);
        case 2:
          result = _context.sent;
          return _context.abrupt("return", res.status(_constant.statusCodes.ok).json({
            success: true,
            message: _constant.Message.loginSuccessfully,
            data: result
          }));
        case 3:
        case "end":
          return _context.stop();
      }
    }, _callee);
  }));
  return function loginAdmin(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();
var createAdmin = exports.createAdmin = /*#__PURE__*/function () {
  var _ref2 = (0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee2(req, res) {
    var _createAdminSchema$va, error, value, result;
    return _regenerator["default"].wrap(function (_context2) {
      while (1) switch (_context2.prev = _context2.next) {
        case 0:
          _createAdminSchema$va = _adminValidator.createAdminSchema.validate(req.body, {
            abortEarly: false
          }), error = _createAdminSchema$va.error, value = _createAdminSchema$va.value;
          if (!error) {
            _context2.next = 1;
            break;
          }
          return _context2.abrupt("return", res.status(_constant.statusCodes.badRequest).json({
            success: false,
            message: _constant.Message.validationError,
            data: null,
            error: {
              errorCode: 'VALIDATION_ERROR',
              detail: error.details.map(function (d) {
                return d.message;
              })
            }
          }));
        case 1:
          _context2.next = 2;
          return (0, _adminService.addAdmin)(value);
        case 2:
          result = _context2.sent;
          return _context2.abrupt("return", res.status(_constant.statusCodes.ok).json({
            success: true,
            message: _constant.Message.adminCreated,
            data: result
          }));
        case 3:
        case "end":
          return _context2.stop();
      }
    }, _callee2);
  }));
  return function createAdmin(_x3, _x4) {
    return _ref2.apply(this, arguments);
  };
}();
var listAdmin = exports.listAdmin = /*#__PURE__*/function () {
  var _ref3 = (0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee3(req, res) {
    var _listAdminSchema$vali, error, value, result;
    return _regenerator["default"].wrap(function (_context3) {
      while (1) switch (_context3.prev = _context3.next) {
        case 0:
          _listAdminSchema$vali = _adminValidator.listAdminSchema.validate(req.query, {
            abortEarly: false
          }), error = _listAdminSchema$vali.error, value = _listAdminSchema$vali.value;
          if (!error) {
            _context3.next = 1;
            break;
          }
          return _context3.abrupt("return", res.status(_constant.statusCodes.badRequest).json({
            success: false,
            message: _constant.Message.validationError,
            data: null,
            error: {
              errorCode: 'VALIDATION_ERROR',
              detail: error.details.map(function (d) {
                return d.message;
              })
            }
          }));
        case 1:
          _context3.next = 2;
          return (0, _adminService.listAdmins)(value);
        case 2:
          result = _context3.sent;
          return _context3.abrupt("return", res.status(_constant.statusCodes.ok).json({
            success: true,
            message: 'Admins retrieved successfully',
            data: result
          }));
        case 3:
        case "end":
          return _context3.stop();
      }
    }, _callee3);
  }));
  return function listAdmin(_x5, _x6) {
    return _ref3.apply(this, arguments);
  };
}();
var updateAdmin = exports.updateAdmin = /*#__PURE__*/function () {
  var _ref4 = (0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee4(req, res) {
    var _updateAdminSchema$va, error, value, result;
    return _regenerator["default"].wrap(function (_context4) {
      while (1) switch (_context4.prev = _context4.next) {
        case 0:
          _updateAdminSchema$va = _adminValidator.updateAdminSchema.validate(_objectSpread(_objectSpread({}, req.body), req.query), {
            abortEarly: false
          }), error = _updateAdminSchema$va.error, value = _updateAdminSchema$va.value;
          if (!error) {
            _context4.next = 1;
            break;
          }
          return _context4.abrupt("return", res.status(_constant.statusCodes.badRequest).json({
            success: false,
            message: _constant.Message.validationError,
            data: null,
            error: {
              errorCode: 'VALIDATION_ERROR',
              detail: error.details.map(function (d) {
                return d.message;
              })
            }
          }));
        case 1:
          _context4.next = 2;
          return (0, _adminService.updateAdmin)(value);
        case 2:
          result = _context4.sent;
          return _context4.abrupt("return", res.status(_constant.statusCodes.ok).json({
            success: true,
            message: 'Admin updated successfully',
            data: result
          }));
        case 3:
        case "end":
          return _context4.stop();
      }
    }, _callee4);
  }));
  return function updateAdmin(_x7, _x8) {
    return _ref4.apply(this, arguments);
  };
}();
var deleteAdminController = exports.deleteAdminController = /*#__PURE__*/function () {
  var _ref5 = (0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee5(req, res) {
    var _deleteAdminSchema$va, error, value, result;
    return _regenerator["default"].wrap(function (_context5) {
      while (1) switch (_context5.prev = _context5.next) {
        case 0:
          _deleteAdminSchema$va = _adminValidator.deleteAdminSchema.validate(req.query, {
            abortEarly: false
          }), error = _deleteAdminSchema$va.error, value = _deleteAdminSchema$va.value;
          if (!error) {
            _context5.next = 1;
            break;
          }
          return _context5.abrupt("return", res.status(_constant.statusCodes.badRequest).json({
            success: false,
            message: _constant.Message.validationError,
            data: null,
            error: {
              errorCode: 'VALIDATION_ERROR',
              detail: error.details.map(function (d) {
                return d.message;
              })
            }
          }));
        case 1:
          _context5.next = 2;
          return (0, _adminService.deleteAdmin)(value);
        case 2:
          result = _context5.sent;
          return _context5.abrupt("return", res.status(_constant.statusCodes.ok).json({
            success: true,
            message: 'Admin deleted successfully',
            data: result
          }));
        case 3:
        case "end":
          return _context5.stop();
      }
    }, _callee5);
  }));
  return function deleteAdminController(_x9, _x0) {
    return _ref5.apply(this, arguments);
  };
}();
var updateAdminAccessController = exports.updateAdminAccessController = /*#__PURE__*/function () {
  var _ref6 = (0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee6(req, res) {
    var _updateAdminAccessSch, error, value, result;
    return _regenerator["default"].wrap(function (_context6) {
      while (1) switch (_context6.prev = _context6.next) {
        case 0:
          _updateAdminAccessSch = _adminValidator.updateAdminAccessSchema.validate(req.body, {
            abortEarly: false
          }), error = _updateAdminAccessSch.error, value = _updateAdminAccessSch.value;
          if (!error) {
            _context6.next = 1;
            break;
          }
          return _context6.abrupt("return", res.status(_constant.statusCodes.badRequest).json({
            success: false,
            message: _constant.Message.validationError,
            data: null,
            error: {
              errorCode: 'VALIDATION_ERROR',
              detail: error.details.map(function (d) {
                return d.message;
              })
            }
          }));
        case 1:
          _context6.next = 2;
          return (0, _adminService.updateAdminAccess)(value);
        case 2:
          result = _context6.sent;
          return _context6.abrupt("return", res.status(_constant.statusCodes.ok).json({
            success: true,
            message: 'Admin access updated successfully',
            data: result
          }));
        case 3:
        case "end":
          return _context6.stop();
      }
    }, _callee6);
  }));
  return function updateAdminAccessController(_x1, _x10) {
    return _ref6.apply(this, arguments);
  };
}();
var getAdminByIdController = exports.getAdminByIdController = /*#__PURE__*/function () {
  var _ref7 = (0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee7(req, res) {
    var _getAdminByIdSchema$v, error, value, result, _t;
    return _regenerator["default"].wrap(function (_context7) {
      while (1) switch (_context7.prev = _context7.next) {
        case 0:
          _getAdminByIdSchema$v = _adminValidator.getAdminByIdSchema.validate(req.query, {
            abortEarly: false
          }), error = _getAdminByIdSchema$v.error, value = _getAdminByIdSchema$v.value;
          if (!error) {
            _context7.next = 1;
            break;
          }
          return _context7.abrupt("return", res.status(_constant.statusCodes.badRequest).json({
            success: false,
            message: _constant.Message.validationError,
            data: null,
            error: {
              errorCode: 'VALIDATION_ERROR',
              detail: error.details.map(function (d) {
                return d.message;
              })
            }
          }));
        case 1:
          _context7.prev = 1;
          _context7.next = 2;
          return (0, _adminService.getAdminById)(value);
        case 2:
          result = _context7.sent;
          return _context7.abrupt("return", res.status(_constant.statusCodes.ok).json({
            success: true,
            message: 'Admin details retrieved successfully',
            data: result
          }));
        case 3:
          _context7.prev = 3;
          _t = _context7["catch"](1);
          return _context7.abrupt("return", res.status(_t.statusCode || _constant.statusCodes.internalServerError).json({
            success: false,
            message: _t.message,
            data: null,
            error: {
              errorCode: _t.errorCode || 'INTERNAL_SERVER_ERROR'
            }
          }));
        case 4:
        case "end":
          return _context7.stop();
      }
    }, _callee7, null, [[1, 3]]);
  }));
  return function getAdminByIdController(_x11, _x12) {
    return _ref7.apply(this, arguments);
  };
}();