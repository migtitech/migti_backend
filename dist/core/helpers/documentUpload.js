"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.uploadMultipleDocuments = exports.uploadDocument = void 0;
var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));
var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));
var _documentModel = _interopRequireDefault(require("../../models/document.model.js"));
var _constant = require("../common/constant.js");
var _s3bucket = require("./s3bucket.js");
var _path = _interopRequireDefault(require("path"));
/**
 * Upload a single file to S3 and create a DocumentModel entry
 */
var uploadDocument = exports.uploadDocument = /*#__PURE__*/function () {
  var _ref = (0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee(file) {
    var folder,
      uploadResult,
      uploaded,
      extension,
      document,
      _args = arguments,
      _t;
    return _regenerator["default"].wrap(function (_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          folder = _args.length > 1 && _args[1] !== undefined ? _args[1] : 'general';
          _context.prev = 1;
          _context.next = 2;
          return (0, _s3bucket.uploadToS3)(file, process.env.AWS_BUCKET_NAME, folder);
        case 2:
          uploadResult = _context.sent;
          if (uploadResult.success) {
            _context.next = 3;
            break;
          }
          throw new Error(uploadResult.message);
        case 3:
          uploaded = uploadResult === null || uploadResult === void 0 ? void 0 : uploadResult.data;
          extension = _path["default"].extname(uploaded.fileName).replace('.', '');
          _context.next = 4;
          return _documentModel["default"].create({
            filename: uploaded === null || uploaded === void 0 ? void 0 : uploaded.originalName,
            filetype: uploaded === null || uploaded === void 0 ? void 0 : uploaded.mimetype,
            extension: extension,
            filesize: uploaded === null || uploaded === void 0 ? void 0 : uploaded.size,
            key: uploaded === null || uploaded === void 0 ? void 0 : uploaded.key,
            fullUrl: uploaded === null || uploaded === void 0 ? void 0 : uploaded.url
          });
        case 4:
          document = _context.sent;
          return _context.abrupt("return", {
            success: true,
            message: _constant.Message === null || _constant.Message === void 0 ? void 0 : _constant.Message.documentUploaded,
            data: document
          });
        case 5:
          _context.prev = 5;
          _t = _context["catch"](1);
          console.error('Upload Document Error:', _t);
          return _context.abrupt("return", {
            success: false,
            message: "".concat(_constant.Message === null || _constant.Message === void 0 ? void 0 : _constant.Message.documentUploadFailed, " ").concat(_t.message),
            data: null
          });
        case 6:
        case "end":
          return _context.stop();
      }
    }, _callee, null, [[1, 5]]);
  }));
  return function uploadDocument(_x) {
    return _ref.apply(this, arguments);
  };
}();

/**
 * Upload multiple files to S3 and create multiple DocumentModel entries
 */
var uploadMultipleDocuments = exports.uploadMultipleDocuments = /*#__PURE__*/function () {
  var _ref2 = (0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee2(files) {
    var folder,
      uploadResults,
      successfulDocs,
      _args2 = arguments,
      _t2;
    return _regenerator["default"].wrap(function (_context2) {
      while (1) switch (_context2.prev = _context2.next) {
        case 0:
          folder = _args2.length > 1 && _args2[1] !== undefined ? _args2[1] : 'general';
          _context2.prev = 1;
          _context2.next = 2;
          return (0, _s3bucket.uploadMultipleToS3)(files, process.env.AWS_BUCKET_NAME, folder);
        case 2:
          uploadResults = _context2.sent;
          _context2.next = 3;
          return Promise.all(uploadResults.data.successful.map(function (uploaded) {
            var extension = _path["default"].extname(uploaded === null || uploaded === void 0 ? void 0 : uploaded.fileName).replace('.', '');
            return _documentModel["default"].create({
              filename: uploaded === null || uploaded === void 0 ? void 0 : uploaded.originalName,
              filetype: uploaded === null || uploaded === void 0 ? void 0 : uploaded.mimetype,
              extension: extension,
              filesize: uploaded === null || uploaded === void 0 ? void 0 : uploaded.size,
              key: uploaded === null || uploaded === void 0 ? void 0 : uploaded.key,
              fullUrl: uploaded === null || uploaded === void 0 ? void 0 : uploaded.url
            });
          }));
        case 3:
          successfulDocs = _context2.sent;
          return _context2.abrupt("return", {
            success: uploadResults === null || uploadResults === void 0 ? void 0 : uploadResults.success,
            message: uploadResults === null || uploadResults === void 0 ? void 0 : uploadResults.message,
            data: {
              successful: successfulDocs,
              failed: uploadResults === null || uploadResults === void 0 ? void 0 : uploadResults.data.failed
            }
          });
        case 4:
          _context2.prev = 4;
          _t2 = _context2["catch"](1);
          console.error('Upload Multiple Documents Error:', _t2);
          return _context2.abrupt("return", {
            success: false,
            message: "".concat(_constant.Message === null || _constant.Message === void 0 ? void 0 : _constant.Message.documentUploadFailed, " ").concat(_t2.message),
            data: null
          });
        case 5:
        case "end":
          return _context2.stop();
      }
    }, _callee2, null, [[1, 4]]);
  }));
  return function uploadMultipleDocuments(_x2) {
    return _ref2.apply(this, arguments);
  };
}();