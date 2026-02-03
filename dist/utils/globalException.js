"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _logger = _interopRequireDefault(require("../core/config/logger.js"));
var _nodeProcess = _interopRequireDefault(require("node:process"));
var globalExceptionHandler = function globalExceptionHandler(err, req, res, next) {
  var _err$isOperational;
  var statusCode = (err === null || err === void 0 ? void 0 : err.statusCode) || 500;
  var message = (err === null || err === void 0 ? void 0 : err.message) || 'Internal Server Error';
  var errorCode = (err === null || err === void 0 ? void 0 : err.errorCode) || 'UNKNOWN_ERROR';
  var errors = (err === null || err === void 0 ? void 0 : err.errors) || [];
  var isOperational = (_err$isOperational = err === null || err === void 0 ? void 0 : err.isOperational) !== null && _err$isOperational !== void 0 ? _err$isOperational : false;
  var stack = (err === null || err === void 0 ? void 0 : err.stack) || 'No stack trace available';

  // Log error with request context
  var method = req.method,
    originalUrl = req.originalUrl,
    body = req.body,
    params = req.params,
    headers = req.headers;
  var logMessage = "\n[ERROR]\nMethod: ".concat(method, "\nURL: ").concat(originalUrl, "\nParams: ").concat(JSON.stringify(params), "\nBody: ").concat(JSON.stringify(body), "\nHeaders: ").concat(JSON.stringify(headers), "\nError Message: ").concat(message, "\nStack: ").concat(stack, "\n  ");
  _logger["default"].error(logMessage);

  // Format the response
  var formattedResponse = {
    success: false,
    message: message,
    data: null,
    error: {
      errorCode: errorCode,
      detail: message
    }
  };

  // ✅ Ensure res exists before using
  if (res && typeof res.status === 'function') {
    res.status(statusCode).json(formattedResponse);
  } else {
    console.error('Invalid Express response object. Cannot send error response.');
  }
};
var _default = exports["default"] = globalExceptionHandler;