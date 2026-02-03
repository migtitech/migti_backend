"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.generateUniqueSlug = exports.generateSlug = exports.generatePlanSlug = void 0;
var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));
var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));
var generateSlug = exports.generateSlug = function generateSlug(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }
  return text.toLowerCase().trim().replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
  .replace(/[\s_-]+/g, '-') // Replace spaces, underscores, and multiple hyphens with single hyphen
  .replace(/^-+|-+$/g, ''); // Remove leading and trailing hyphens
};
var generateUniqueSlug = exports.generateUniqueSlug = /*#__PURE__*/function () {
  var _ref = (0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee(baseSlug, checkExistence) {
    var maxAttempts,
      slug,
      counter,
      exists,
      _exists,
      _args = arguments;
    return _regenerator["default"].wrap(function (_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          maxAttempts = _args.length > 2 && _args[2] !== undefined ? _args[2] : 100;
          slug = baseSlug;
          counter = 1;
          _context.next = 1;
          return checkExistence(slug);
        case 1:
          exists = _context.sent;
          if (exists) {
            _context.next = 2;
            break;
          }
          return _context.abrupt("return", slug);
        case 2:
          if (!(counter <= maxAttempts)) {
            _context.next = 5;
            break;
          }
          slug = "".concat(baseSlug, "-").concat(counter);
          _context.next = 3;
          return checkExistence(slug);
        case 3:
          _exists = _context.sent;
          if (_exists) {
            _context.next = 4;
            break;
          }
          return _context.abrupt("return", slug);
        case 4:
          counter++;
          _context.next = 2;
          break;
        case 5:
          return _context.abrupt("return", "".concat(baseSlug, "-").concat(Date.now()));
        case 6:
        case "end":
          return _context.stop();
      }
    }, _callee);
  }));
  return function generateUniqueSlug(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();
var generatePlanSlug = exports.generatePlanSlug = /*#__PURE__*/function () {
  var _ref2 = (0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee2(membershipname, checkExistence) {
    var baseSlug;
    return _regenerator["default"].wrap(function (_context2) {
      while (1) switch (_context2.prev = _context2.next) {
        case 0:
          baseSlug = generateSlug(membershipname);
          if (baseSlug) {
            _context2.next = 1;
            break;
          }
          return _context2.abrupt("return", generateUniqueSlug('plan', checkExistence));
        case 1:
          return _context2.abrupt("return", generateUniqueSlug(baseSlug, checkExistence));
        case 2:
        case "end":
          return _context2.stop();
      }
    }, _callee2);
  }));
  return function generatePlanSlug(_x3, _x4) {
    return _ref2.apply(this, arguments);
  };
}();