"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));
var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));
var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));
var _wrapNativeSuper2 = _interopRequireDefault(require("@babel/runtime/helpers/wrapNativeSuper"));
function _callSuper(t, o, e) { return o = (0, _getPrototypeOf2["default"])(o), (0, _possibleConstructorReturn2["default"])(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], (0, _getPrototypeOf2["default"])(t).constructor) : o.apply(t, e)); }
function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
var CustomError = /*#__PURE__*/function (_Error) {
  function CustomError(statusCode) {
    var _this;
    var message = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'Something went wrong';
    var errorCode = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'UNKNWON_ERROR';
    var errors = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : [];
    var isOperational = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : true;
    var stack = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : '';
    (0, _classCallCheck2["default"])(this, CustomError);
    _this = _callSuper(this, CustomError, [message]);
    _this.success = false;
    _this.statusCode = statusCode;
    _this.data = null;
    _this.message = message;
    _this.errors = errors;
    _this.errorCode = errorCode;
    _this.isOperational = isOperational;
    _this.stack = stack || new Error().stack;
    Error.captureStackTrace(_this, _this.constructor);
    return _this;
  }
  (0, _inherits2["default"])(CustomError, _Error);
  return (0, _createClass2["default"])(CustomError);
}(/*#__PURE__*/(0, _wrapNativeSuper2["default"])(Error));
var _default = exports["default"] = CustomError;