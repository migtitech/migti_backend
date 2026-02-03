"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.generateQR = void 0;
var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));
var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));
var _qrcode = _interopRequireDefault(require("qrcode"));
var _constant = require("../common/constant.js");
var _exception = _interopRequireDefault(require("../../utils/exception.js"));
var generateQR = exports.generateQR = /*#__PURE__*/function () {
  var _ref = (0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee(passCode) {
    var PassCodeString, url, _t;
    return _regenerator["default"].wrap(function (_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          PassCodeString = String(passCode);
          _context.next = 1;
          return _qrcode["default"].toDataURL(PassCodeString);
        case 1:
          url = _context.sent;
          return _context.abrupt("return", url);
        case 2:
          _context.prev = 2;
          _t = _context["catch"](0);
          return _context.abrupt("return", new _exception["default"](_constant.statusCodes === null || _constant.statusCodes === void 0 ? void 0 : _constant.statusCodes.badRequest, _constant.Message === null || _constant.Message === void 0 ? void 0 : _constant.Message.notCreated, _constant.errorCodes === null || _constant.errorCodes === void 0 ? void 0 : _constant.errorCodes.bad_request));
        case 3:
        case "end":
          return _context.stop();
      }
    }, _callee, null, [[0, 2]]);
  }));
  return function generateQR(_x) {
    return _ref.apply(this, arguments);
  };
}();