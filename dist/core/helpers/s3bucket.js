"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.uploadToS3 = exports.uploadMultipleToS3 = exports["default"] = void 0;
var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));
var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));
var _clientS = require("@aws-sdk/client-s3");
var _uuid = require("uuid");
var _path = _interopRequireDefault(require("path"));
var s3Client = new _clientS.S3Client({
  region: process.env.AWS_REGION || 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});
var uploadToS3 = exports.uploadToS3 = /*#__PURE__*/function () {
  var _ref = (0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee(file) {
    var bucketName,
      folder,
      fileExtension,
      fileName,
      key,
      uploadParams,
      command,
      uploadPromise,
      timeoutPromise,
      result,
      fileUrl,
      _args = arguments,
      _t;
    return _regenerator["default"].wrap(function (_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          bucketName = _args.length > 1 && _args[1] !== undefined ? _args[1] : process.env.AWS_BUCKET_NAME;
          folder = _args.length > 2 && _args[2] !== undefined ? _args[2] : 'general';
          _context.prev = 1;
          if (file) {
            _context.next = 2;
            break;
          }
          return _context.abrupt("return", {
            success: false,
            message: 'No file provided',
            data: null
          });
        case 2:
          if (bucketName) {
            _context.next = 3;
            break;
          }
          return _context.abrupt("return", {
            success: false,
            message: 'Bucket name is required',
            data: null
          });
        case 3:
          if (!(!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY)) {
            _context.next = 4;
            break;
          }
          return _context.abrupt("return", {
            success: false,
            message: 'AWS credentials not configured',
            data: null
          });
        case 4:
          console.log('Starting S3 upload for file:', file.originalname);
          fileExtension = _path["default"].extname(file.originalname);
          fileName = "".concat((0, _uuid.v4)()).concat(fileExtension);
          key = folder ? "".concat(folder, "/").concat(fileName) : fileName;
          uploadParams = {
            Bucket: bucketName,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype
            // ACL removed - bucket doesn't allow ACLs, use bucket policy instead
          };
          command = new _clientS.PutObjectCommand(uploadParams); // Add timeout to prevent infinite hanging
          uploadPromise = s3Client.send(command);
          timeoutPromise = new Promise(function (_, reject) {
            setTimeout(function () {
              return reject(new Error('Upload timeout after 30 seconds'));
            }, 30000);
          });
          _context.next = 5;
          return Promise.race([uploadPromise, timeoutPromise]);
        case 5:
          result = _context.sent;
          fileUrl = "https://".concat(bucketName, ".s3.").concat(process.env.AWS_REGION || 'us-east-1', ".amazonaws.com/").concat(key);
          console.log('S3 upload completed successfully for:', file.originalname);
          return _context.abrupt("return", {
            success: true,
            message: 'File uploaded successfully',
            data: {
              fileName: fileName,
              originalName: file.originalname,
              key: key,
              url: fileUrl,
              size: file.size,
              mimetype: file.mimetype,
              etag: result.ETag
            }
          });
        case 6:
          _context.prev = 6;
          _t = _context["catch"](1);
          console.error('S3 Upload Error:', _t);
          return _context.abrupt("return", {
            success: false,
            message: "Upload failed: ".concat(_t.message),
            data: null,
            error: _t.message
          });
        case 7:
        case "end":
          return _context.stop();
      }
    }, _callee, null, [[1, 6]]);
  }));
  return function uploadToS3(_x) {
    return _ref.apply(this, arguments);
  };
}();
var uploadMultipleToS3 = exports.uploadMultipleToS3 = /*#__PURE__*/function () {
  var _ref2 = (0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee2(files) {
    var bucketName,
      folder,
      uploadPromises,
      results,
      successfulUploads,
      failedUploads,
      _args2 = arguments,
      _t2;
    return _regenerator["default"].wrap(function (_context2) {
      while (1) switch (_context2.prev = _context2.next) {
        case 0:
          bucketName = _args2.length > 1 && _args2[1] !== undefined ? _args2[1] : process.env.AWS_BUCKET_NAME;
          folder = _args2.length > 2 && _args2[2] !== undefined ? _args2[2] : 'general';
          _context2.prev = 1;
          if (!(!files || files.length === 0)) {
            _context2.next = 2;
            break;
          }
          return _context2.abrupt("return", {
            success: false,
            message: 'No files provided',
            data: null
          });
        case 2:
          if (bucketName) {
            _context2.next = 3;
            break;
          }
          return _context2.abrupt("return", {
            success: false,
            message: 'Bucket name is required',
            data: null
          });
        case 3:
          uploadPromises = files.map(function (file) {
            return uploadToS3(file, bucketName, folder);
          });
          _context2.next = 4;
          return Promise.all(uploadPromises);
        case 4:
          results = _context2.sent;
          successfulUploads = results.filter(function (result) {
            return result.success;
          });
          failedUploads = results.filter(function (result) {
            return !result.success;
          });
          return _context2.abrupt("return", {
            success: failedUploads.length === 0,
            message: failedUploads.length === 0 ? 'All files uploaded successfully' : "".concat(successfulUploads.length, " files uploaded, ").concat(failedUploads.length, " failed"),
            data: {
              successful: successfulUploads.map(function (result) {
                return result.data;
              }),
              failed: failedUploads.map(function (result) {
                return result.message;
              }),
              total: files.length,
              successfulCount: successfulUploads.length,
              failedCount: failedUploads.length
            }
          });
        case 5:
          _context2.prev = 5;
          _t2 = _context2["catch"](1);
          console.error('Multiple S3 Upload Error:', _t2);
          return _context2.abrupt("return", {
            success: false,
            message: "Multiple upload failed: ".concat(_t2.message),
            data: null
          });
        case 6:
        case "end":
          return _context2.stop();
      }
    }, _callee2, null, [[1, 5]]);
  }));
  return function uploadMultipleToS3(_x2) {
    return _ref2.apply(this, arguments);
  };
}();
var _default = exports["default"] = {
  uploadToS3: uploadToS3,
  uploadMultipleToS3: uploadMultipleToS3
};