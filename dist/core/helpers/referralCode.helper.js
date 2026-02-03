"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.imageToBase64 = exports.generateUniqueReferralCode = exports.generateReferralCode = void 0;
var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));
var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));
var _path = _interopRequireDefault(require("path"));
var _fs = _interopRequireDefault(require("fs"));
var generateReferralCode = exports.generateReferralCode = function generateReferralCode() {
  var length = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 12;
  var characters = '1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  var result = '';
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};
var generateUniqueReferralCode = exports.generateUniqueReferralCode = /*#__PURE__*/function () {
  var _ref = (0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee(Model) {
    var length,
      maxAttempts,
      attempts,
      code,
      existingUser,
      _args = arguments;
    return _regenerator["default"].wrap(function (_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          length = _args.length > 1 && _args[1] !== undefined ? _args[1] : 12;
          maxAttempts = _args.length > 2 && _args[2] !== undefined ? _args[2] : 10;
          attempts = 0;
        case 1:
          if (!(attempts < maxAttempts)) {
            _context.next = 4;
            break;
          }
          code = generateReferralCode(length);
          _context.next = 2;
          return Model.findOne({
            refferalCode: code
          }).lean();
        case 2:
          existingUser = _context.sent;
          if (existingUser) {
            _context.next = 3;
            break;
          }
          return _context.abrupt("return", code);
        case 3:
          attempts++;
          _context.next = 1;
          break;
        case 4:
        case "end":
          return _context.stop();
      }
    }, _callee);
  }));
  return function generateUniqueReferralCode(_x) {
    return _ref.apply(this, arguments);
  };
}();
var imageToBase64 = exports.imageToBase64 = function imageToBase64(filePath) {
  try {
    var file = _fs["default"].readFileSync(filePath);
    return "data:image/png;base64,".concat(Buffer.from(file).toString('base64'));
  } catch (error) {
    console.error('Error reading logo file:', error);
    return null; // Return null if the logo can't be read
  }
};