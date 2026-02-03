"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));
var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));
var _constant = require("../core/common/constant.js");
var _logger = _interopRequireDefault(require("../core/config/logger.js"));
var _nodeProcess = _interopRequireDefault(require("node:process"));
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { (0, _defineProperty2["default"])(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
// Function to sanitize sensitive data
var _sanitizeData = function sanitizeData(data) {
  if (!data) return data;

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(function (item) {
      return _sanitizeData(item);
    });
  }

  // Handle non-objects
  if ((0, _typeof2["default"])(data) !== 'object') return data;
  var sanitized = _objectSpread({}, data);

  // Remove sensitive fields
  delete sanitized.password;
  delete sanitized.__v;
  delete sanitized.createdAt;
  delete sanitized.updatedAt;

  // Convert _id to id for better API consistency
  if (sanitized._id) {
    sanitized.id = sanitized._id;
    delete sanitized._id;
  }

  // Add default role if not present (only for user objects)
  if (!sanitized.role && sanitized.email) {
    sanitized.role = 'SUPER_ADMIN';
  }
  return sanitized;
};
var responseInterceptor = function responseInterceptor(req, res, next) {
  var oldSend = res.json;
  res.json = function (data) {
    var formattedResponse;

    // If response is an instance of Error or CustomError, treat as error
    if (data instanceof Error || data !== null && data !== void 0 && data.errorCode || (data === null || data === void 0 ? void 0 : data.statusCode) >= 400) {
      formattedResponse = {
        success: data.success !== undefined ? data.success : false,
        message: data.message || 'An error occurred',
        data: null,
        error: {
          errorCode: data.errorCode || 'UNKNOWN_ERROR',
          detail: data.message || 'An error occurred'
        }
      };
      _logger["default"].error("Error Response for [".concat(req.method, " ").concat(req.originalUrl, "]:\n").concat(JSON.stringify(formattedResponse, null, 2)));
      return oldSend.call(res, formattedResponse);
    }

    // If response already has the correct format (from service layer), use it as is
    if (data !== null && data !== void 0 && data.message && ((data === null || data === void 0 ? void 0 : data.data) !== undefined || (data === null || data === void 0 ? void 0 : data.error) !== undefined) && !(data !== null && data !== void 0 && data.errorCode)) {
      formattedResponse = {
        success: data.success !== undefined ? data.success : true,
        message: data.message,
        data: _sanitizeData(data.data),
        error: data.error
      };
      // Logging removed for development
      return oldSend.call(res, formattedResponse);
    }

    // If validation error
    if ((data === null || data === void 0 ? void 0 : data.message) === _constant.Message.validationError) {
      formattedResponse = {
        success: false,
        message: data.message || 'Validation error',
        data: null,
        error: {
          errorCode: 'VALIDATION_ERROR',
          detail: data.details || []
        }
      };
    } else {
      // Standard success case - format the response properly
      formattedResponse = {
        success: (data === null || data === void 0 ? void 0 : data.success) !== undefined ? data.success : true,
        message: (data === null || data === void 0 ? void 0 : data.message) || 'Success',
        data: _sanitizeData((data === null || data === void 0 ? void 0 : data.data) || data || {}),
        error: null
      };
    }

    // Logging removed for development
    oldSend.call(res, formattedResponse);
  };
  res.error = function (error) {
    var statusCode = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 500;
    var message = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'Internal Server Error';
    var formattedResponse = {
      success: false,
      message: message,
      data: null,
      error: {
        errorCode: (error === null || error === void 0 ? void 0 : error.errorCode) || 'UNKNOWN_ERROR',
        detail: (error === null || error === void 0 ? void 0 : error.message) || message
      }
    };
    _logger["default"].error("Error Response for [".concat(req.method, " ").concat(req.originalUrl, "]:\n").concat(JSON.stringify(formattedResponse, null, 2)));
    res.status(statusCode).json(formattedResponse);
  };
  next();
};
var _default = exports["default"] = responseInterceptor;