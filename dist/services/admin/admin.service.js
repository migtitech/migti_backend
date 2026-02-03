"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.updateAdminAccess = exports.updateAdmin = exports.listAdmins = exports.getAdminById = exports.deleteAdmin = exports.adminLogin = exports.addAdmin = void 0;
var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));
var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));
var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));
var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));
var _adminModel = _interopRequireDefault(require("../../models/admin.model.js"));
var _constant = require("../../core/common/constant.js");
var _exception = _interopRequireDefault(require("../../utils/exception.js"));
var _helperCryto = require("../../core/crypto/helper.cryto.js");
var _jwtHelper = require("../../core/helpers/jwt.helper.js");
var _excluded = ["adminId"];
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { (0, _defineProperty2["default"])(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
var adminLogin = exports.adminLogin = /*#__PURE__*/function () {
  var _ref2 = (0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee(_ref) {
    var email, password, admin, decryptedPassword, tokenPayload, tokens;
    return _regenerator["default"].wrap(function (_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          email = _ref.email, password = _ref.password;
          _context.next = 1;
          return _adminModel["default"].findOne({
            email: email
          }).lean();
        case 1:
          admin = _context.sent;
          if (admin) {
            _context.next = 2;
            break;
          }
          throw new _exception["default"](_constant.statusCodes.notFound, _constant.Message.notFound, _constant.errorCodes.not_found);
        case 2:
          decryptedPassword = (0, _helperCryto.decrypt)(admin.password);
          if (!(password !== decryptedPassword)) {
            _context.next = 3;
            break;
          }
          throw new _exception["default"](_constant.statusCodes.unauthorized, _constant.Message.wrongPassword, _constant.errorCodes.unauthorized);
        case 3:
          tokenPayload = {
            id: admin._id,
            email: admin.email,
            role: 'admin',
            type: 'access',
            access: admin.access
          };
          tokens = (0, _jwtHelper.createTokenPair)(tokenPayload);
          return _context.abrupt("return", _objectSpread({
            admin: _objectSpread(_objectSpread({}, admin), {}, {
              access: admin.access
            })
          }, tokens));
        case 4:
        case "end":
          return _context.stop();
      }
    }, _callee);
  }));
  return function adminLogin(_x) {
    return _ref2.apply(this, arguments);
  };
}();
var addAdmin = exports.addAdmin = /*#__PURE__*/function () {
  var _ref3 = (0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee2(adminData) {
    var name, email, password, existingAdmin, adminDoc, admin;
    return _regenerator["default"].wrap(function (_context2) {
      while (1) switch (_context2.prev = _context2.next) {
        case 0:
          name = adminData.name, email = adminData.email, password = adminData.password;
          _context2.next = 1;
          return _adminModel["default"].findOne({
            email: email
          });
        case 1:
          existingAdmin = _context2.sent;
          if (!existingAdmin) {
            _context2.next = 2;
            break;
          }
          throw new _exception["default"](_constant.statusCodes.conflict, _constant.Message.alreadyExist, _constant.errorCodes.already_exist);
        case 2:
          adminData.password = (0, _helperCryto.encrypt)(password);
          adminData.access = ['admin'];
          _context2.next = 3;
          return _adminModel["default"].create(adminData);
        case 3:
          adminDoc = _context2.sent;
          admin = adminDoc.toObject();
          return _context2.abrupt("return", admin);
        case 4:
        case "end":
          return _context2.stop();
      }
    }, _callee2);
  }));
  return function addAdmin(_x2) {
    return _ref3.apply(this, arguments);
  };
}();
var listAdmins = exports.listAdmins = /*#__PURE__*/function () {
  var _ref5 = (0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee3(_ref4) {
    var _ref4$pageNumber, pageNumber, _ref4$pageSize, pageSize, page, limit, skip, totalItems, admins, totalPages, hasNextPage, hasPrevPage;
    return _regenerator["default"].wrap(function (_context3) {
      while (1) switch (_context3.prev = _context3.next) {
        case 0:
          _ref4$pageNumber = _ref4.pageNumber, pageNumber = _ref4$pageNumber === void 0 ? 1 : _ref4$pageNumber, _ref4$pageSize = _ref4.pageSize, pageSize = _ref4$pageSize === void 0 ? 10 : _ref4$pageSize;
          page = Math.max(1, parseInt(pageNumber));
          limit = Math.min(100, Math.max(1, parseInt(pageSize)));
          skip = (page - 1) * limit;
          _context3.next = 1;
          return _adminModel["default"].countDocuments();
        case 1:
          totalItems = _context3.sent;
          _context3.next = 2;
          return _adminModel["default"].find().select('-password').sort({
            createdAt: -1
          }).skip(skip).limit(limit).lean();
        case 2:
          admins = _context3.sent;
          totalPages = Math.ceil(totalItems / limit);
          hasNextPage = page < totalPages;
          hasPrevPage = page > 1;
          return _context3.abrupt("return", {
            admins: admins,
            pagination: {
              currentPage: page,
              totalPages: totalPages,
              totalItems: totalItems,
              itemsPerPage: limit,
              hasNextPage: hasNextPage,
              hasPrevPage: hasPrevPage
            }
          });
        case 3:
        case "end":
          return _context3.stop();
      }
    }, _callee3);
  }));
  return function listAdmins(_x3) {
    return _ref5.apply(this, arguments);
  };
}();
var updateAdmin = exports.updateAdmin = /*#__PURE__*/function () {
  var _ref7 = (0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee4(_ref6) {
    var adminId, updateData, admin, updatedAdmin;
    return _regenerator["default"].wrap(function (_context4) {
      while (1) switch (_context4.prev = _context4.next) {
        case 0:
          adminId = _ref6.adminId, updateData = (0, _objectWithoutProperties2["default"])(_ref6, _excluded);
          _context4.next = 1;
          return _adminModel["default"].findById(adminId).lean();
        case 1:
          admin = _context4.sent;
          if (admin) {
            _context4.next = 2;
            break;
          }
          throw new _exception["default"](_constant.statusCodes.notFound, 'Admin not found', _constant.errorCodes.not_found);
        case 2:
          if (updateData.password) {
            updateData.password = (0, _helperCryto.encrypt)(updateData.password);
          }
          _context4.next = 3;
          return _adminModel["default"].findByIdAndUpdate(adminId, updateData, {
            "new": true,
            runValidators: true
          }).select('-password').lean();
        case 3:
          updatedAdmin = _context4.sent;
          return _context4.abrupt("return", updatedAdmin);
        case 4:
        case "end":
          return _context4.stop();
      }
    }, _callee4);
  }));
  return function updateAdmin(_x4) {
    return _ref7.apply(this, arguments);
  };
}();
var deleteAdmin = exports.deleteAdmin = /*#__PURE__*/function () {
  var _ref9 = (0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee5(_ref8) {
    var adminId, admin;
    return _regenerator["default"].wrap(function (_context5) {
      while (1) switch (_context5.prev = _context5.next) {
        case 0:
          adminId = _ref8.adminId;
          _context5.next = 1;
          return _adminModel["default"].findById(adminId).lean();
        case 1:
          admin = _context5.sent;
          if (admin) {
            _context5.next = 2;
            break;
          }
          throw new _exception["default"](_constant.statusCodes.notFound, 'Admin not found', _constant.errorCodes.not_found);
        case 2:
          _context5.next = 3;
          return _adminModel["default"].findByIdAndDelete(adminId);
        case 3:
          return _context5.abrupt("return", {
            deletedAdmin: {
              id: admin._id,
              name: admin.name,
              email: admin.email,
              uniqueId: admin.uniqueId,
              deletedAt: new Date().toISOString()
            }
          });
        case 4:
        case "end":
          return _context5.stop();
      }
    }, _callee5);
  }));
  return function deleteAdmin(_x5) {
    return _ref9.apply(this, arguments);
  };
}();
var updateAdminAccess = exports.updateAdminAccess = /*#__PURE__*/function () {
  var _ref1 = (0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee6(_ref0) {
    var adminId, access, admin, updatedAdmin;
    return _regenerator["default"].wrap(function (_context6) {
      while (1) switch (_context6.prev = _context6.next) {
        case 0:
          adminId = _ref0.adminId, access = _ref0.access;
          _context6.next = 1;
          return _adminModel["default"].findById(adminId).lean();
        case 1:
          admin = _context6.sent;
          if (admin) {
            _context6.next = 2;
            break;
          }
          throw new _exception["default"](_constant.statusCodes.notFound, 'Admin not found', _constant.errorCodes.not_found);
        case 2:
          _context6.next = 3;
          return _adminModel["default"].findByIdAndUpdate(adminId, {
            access: access
          }, {
            "new": true,
            runValidators: true
          }).select('-password').lean();
        case 3:
          updatedAdmin = _context6.sent;
          return _context6.abrupt("return", updatedAdmin);
        case 4:
        case "end":
          return _context6.stop();
      }
    }, _callee6);
  }));
  return function updateAdminAccess(_x6) {
    return _ref1.apply(this, arguments);
  };
}();
var getAdminById = exports.getAdminById = /*#__PURE__*/function () {
  var _ref11 = (0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee7(_ref10) {
    var adminId, admin;
    return _regenerator["default"].wrap(function (_context7) {
      while (1) switch (_context7.prev = _context7.next) {
        case 0:
          adminId = _ref10.adminId;
          _context7.next = 1;
          return _adminModel["default"].findById(adminId).select('-password').lean();
        case 1:
          admin = _context7.sent;
          if (admin) {
            _context7.next = 2;
            break;
          }
          throw new _exception["default"](_constant.statusCodes.notFound, 'Admin not found', _constant.errorCodes.not_found);
        case 2:
          return _context7.abrupt("return", admin);
        case 3:
        case "end":
          return _context7.stop();
      }
    }, _callee7);
  }));
  return function getAdminById(_x7) {
    return _ref11.apply(this, arguments);
  };
}();