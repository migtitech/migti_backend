"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.upload = void 0;
var _multer = _interopRequireDefault(require("multer"));
var _path = _interopRequireDefault(require("path"));
var storage = _multer["default"].diskStorage({
  destination: function destination(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function filename(req, file, cb) {
    var ext = _path["default"].extname(file.originalname);
    cb(null, "".concat(file.fieldname, "-").concat(Date.now()).concat(ext));
  }
});
var upload = exports.upload = (0, _multer["default"])({
  storage: storage
});