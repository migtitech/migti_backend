"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.uploadSingle = exports.uploadMultiple = exports.uploadChunk = exports.handleMulterError = void 0;
var _multer = _interopRequireDefault(require("multer"));
var storage = _multer["default"].memoryStorage();
var fileFilter = function fileFilter(req, file, cb) {
  var allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm', 'video/mkv', 'video/quicktime'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("File type ".concat(file.mimetype, " not allowed")), false);
  }
};
var uploadSingle = exports.uploadSingle = (0, _multer["default"])({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});
var uploadMultiple = exports.uploadMultiple = (0, _multer["default"])({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 5
  }
});
var uploadChunk = exports.uploadChunk = (0, _multer["default"])({
  storage: storage,
  fileFilter: function fileFilter(req, file, cb) {
    var allowedVideoTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm', 'video/mkv', 'video/quicktime'];
    if (allowedVideoTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("File type ".concat(file.mimetype, " not allowed for video uploads")), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});
var handleMulterError = exports.handleMulterError = function handleMulterError(error, req, res, next) {
  if (error instanceof _multer["default"].MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large',
        data: null
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum 5 files allowed',
        data: null
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected field name for file upload',
        data: null
      });
    }
  }
  if (error.message.includes('File type')) {
    return res.status(400).json({
      success: false,
      message: error.message,
      data: null
    });
  }
  next(error);
};