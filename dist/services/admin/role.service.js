"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.updateRole = exports.listRoles = exports.getRoleById = exports.deleteRole = exports.addRole = void 0;
var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));
var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));
var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));
var _roleModel = _interopRequireDefault(require("../../models/role.model.js"));
var _exception = _interopRequireDefault(require("../../utils/exception.js"));
var _constant = require("../../core/common/constant.js");
var _excluded = ["roleId"];
var addRole = exports.addRole = /*#__PURE__*/function () {
  var _ref2 = (0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee(_ref) {
    var name, description, permissions, existingRole, role;
    return _regenerator["default"].wrap(function (_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          name = _ref.name, description = _ref.description, permissions = _ref.permissions;
          _context.next = 1;
          return _roleModel["default"].findOne({
            name: name
          });
        case 1:
          existingRole = _context.sent;
          if (!existingRole) {
            _context.next = 2;
            break;
          }
          throw new _exception["default"](_constant.statusCodes.conflict, 'Role already exists', _constant.errorCodes.already_exist);
        case 2:
          _context.next = 3;
          return _roleModel["default"].create({
            name: name,
            description: description,
            permissions: permissions
          });
        case 3:
          role = _context.sent;
          return _context.abrupt("return", role.toObject());
        case 4:
        case "end":
          return _context.stop();
      }
    }, _callee);
  }));
  return function addRole(_x) {
    return _ref2.apply(this, arguments);
  };
}();
var listRoles = exports.listRoles = /*#__PURE__*/function () {
  var _ref3 = (0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee2() {
    var page,
      limit,
      search,
      skip,
      filter,
      totalItems,
      roles,
      totalPages,
      _args2 = arguments;
    return _regenerator["default"].wrap(function (_context2) {
      while (1) switch (_context2.prev = _context2.next) {
        case 0:
          page = _args2.length > 0 && _args2[0] !== undefined ? _args2[0] : 1;
          limit = _args2.length > 1 && _args2[1] !== undefined ? _args2[1] : 10;
          search = _args2.length > 2 && _args2[2] !== undefined ? _args2[2] : '';
          skip = (page - 1) * limit;
          filter = {};
          if (search) {
            filter.$or = [{
              name: {
                $regex: search,
                $options: 'i'
              }
            }, {
              permissions: {
                $regex: search,
                $options: 'i'
              }
            }];
          }
          _context2.next = 1;
          return _roleModel["default"].countDocuments();
        case 1:
          totalItems = _context2.sent;
          _context2.next = 2;
          return _roleModel["default"].find(filter).sort({
            createdAt: -1
          }).skip(skip).limit(limit).lean();
        case 2:
          roles = _context2.sent;
          totalPages = Math.ceil(totalItems / limit);
          return _context2.abrupt("return", {
            roles: roles,
            pagination: {
              currentPage: page,
              totalPages: totalPages,
              totalItems: totalItems,
              itemsPerPage: limit,
              hasNextPage: page < totalPages,
              hasPrevPage: page > 1
            }
          });
        case 3:
        case "end":
          return _context2.stop();
      }
    }, _callee2);
  }));
  return function listRoles() {
    return _ref3.apply(this, arguments);
  };
}();
var getRoleById = exports.getRoleById = /*#__PURE__*/function () {
  var _ref5 = (0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee3(_ref4) {
    var roleId, role;
    return _regenerator["default"].wrap(function (_context3) {
      while (1) switch (_context3.prev = _context3.next) {
        case 0:
          roleId = _ref4.roleId;
          _context3.next = 1;
          return _roleModel["default"].findById(roleId).lean();
        case 1:
          role = _context3.sent;
          if (role) {
            _context3.next = 2;
            break;
          }
          throw new _exception["default"](_constant.statusCodes.notFound, 'Role not found', _constant.errorCodes.not_found);
        case 2:
          return _context3.abrupt("return", role);
        case 3:
        case "end":
          return _context3.stop();
      }
    }, _callee3);
  }));
  return function getRoleById(_x2) {
    return _ref5.apply(this, arguments);
  };
}();
var updateRole = exports.updateRole = /*#__PURE__*/function () {
  var _ref7 = (0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee4(_ref6) {
    var roleId, updateData, role, updatedRole;
    return _regenerator["default"].wrap(function (_context4) {
      while (1) switch (_context4.prev = _context4.next) {
        case 0:
          roleId = _ref6.roleId, updateData = (0, _objectWithoutProperties2["default"])(_ref6, _excluded);
          _context4.next = 1;
          return _roleModel["default"].findById(roleId).lean();
        case 1:
          role = _context4.sent;
          if (role) {
            _context4.next = 2;
            break;
          }
          throw new _exception["default"](_constant.statusCodes.notFound, 'Role not found', _constant.errorCodes.not_found);
        case 2:
          _context4.next = 3;
          return _roleModel["default"].findByIdAndUpdate(roleId, updateData, {
            "new": true,
            runValidators: true
          }).lean();
        case 3:
          updatedRole = _context4.sent;
          return _context4.abrupt("return", updatedRole);
        case 4:
        case "end":
          return _context4.stop();
      }
    }, _callee4);
  }));
  return function updateRole(_x3) {
    return _ref7.apply(this, arguments);
  };
}();
var deleteRole = exports.deleteRole = /*#__PURE__*/function () {
  var _ref9 = (0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee5(_ref8) {
    var roleId, role;
    return _regenerator["default"].wrap(function (_context5) {
      while (1) switch (_context5.prev = _context5.next) {
        case 0:
          roleId = _ref8.roleId;
          _context5.next = 1;
          return _roleModel["default"].findById(roleId).lean();
        case 1:
          role = _context5.sent;
          if (role) {
            _context5.next = 2;
            break;
          }
          throw new _exception["default"](_constant.statusCodes.notFound, 'Role not found', _constant.errorCodes.not_found);
        case 2:
          _context5.next = 3;
          return _roleModel["default"].findByIdAndDelete(roleId);
        case 3:
          return _context5.abrupt("return", {
            deletedRole: {
              id: role._id,
              name: role.name,
              deletedAt: new Date().toISOString()
            }
          });
        case 4:
        case "end":
          return _context5.stop();
      }
    }, _callee5);
  }));
  return function deleteRole(_x4) {
    return _ref9.apply(this, arguments);
  };
}();