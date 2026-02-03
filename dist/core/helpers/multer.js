"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.upload = void 0;
var _multer = _interopRequireDefault(require("multer"));
// Use memory storage so files have a buffer for direct S3 upload
var storage = _multer["default"].memoryStorage();
var fileFilter = function fileFilter(req, file, cb) {
  var allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image, PDF, Word, and Excel files are allowed'), false);
  }
};
var upload = exports.upload = (0, _multer["default"])({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 200
  } // 5 MB
});