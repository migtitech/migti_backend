"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.uploadPoBillingAttachmentMemory = exports.uploadCatalogMemory = exports.uploadAssetsMemory = exports.uploadAssets = exports.upload = void 0;
var _multer = _interopRequireDefault(require("multer"));
var _path = _interopRequireDefault(require("path"));
var _uuid = require("uuid");
var _documentModel = require("../models/document.model.js");
var uploadsDir = 'uploads';

// Generic upload (existing): stores in uploads/
var storage = _multer["default"].diskStorage({
  destination: function destination(_req, _file, cb) {
    cb(null, uploadsDir + '/');
  },
  filename: function filename(_req, file, cb) {
    var ext = _path["default"].extname(file.originalname);
    cb(null, "".concat(file.fieldname, "-").concat(Date.now()).concat(ext));
  }
});
var upload = exports.upload = (0, _multer["default"])({
  storage: storage
});

// Assets upload: stores in assets/ with dynamic folders (product, variant).
// Query params: productId (optional), variantUniqueId (optional).
// Paths: assets/products/:productId/  or  assets/products/:productId/variants/:variantUniqueId/  or  assets/temp/
var getAssetsDestination = function getAssetsDestination(req, file, cb) {
  try {
    var productId = req.query.productId;
    var variantUniqueId = req.query.variantUniqueId;
    var dir;
    if (productId) {
      if (variantUniqueId) {
        dir = _path["default"].join('assets', 'products', String(productId), 'variants', String(variantUniqueId));
      } else {
        dir = _path["default"].join('assets', 'products', String(productId));
      }
    } else {
      dir = _path["default"].join('assets', 'temp');
    }
    (0, _documentModel.ensureAssetsDir)(dir);
    cb(null, dir + _path["default"].sep);
  } catch (err) {
    cb(err);
  }
};
var getAssetsFilename = function getAssetsFilename(req, file, cb) {
  var ext = _path["default"].extname(file.originalname) || '.jpg';
  var base = _path["default"].basename(file.originalname, ext).replace(/\s+/g, '-').slice(0, 50);
  cb(null, "".concat(base, "-").concat(Date.now(), "-").concat((0, _uuid.v4)().slice(0, 8)).concat(ext));
};
var assetsStorage = _multer["default"].diskStorage({
  destination: getAssetsDestination,
  filename: getAssetsFilename
});
var imageFilter = function imageFilter(_req, file, cb) {
  var allowed = /^image\/.+/i;
  if (allowed.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};
var uploadAssets = exports.uploadAssets = (0, _multer["default"])({
  storage: assetsStorage,
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  // 10MB per file
  fileFilter: imageFilter
});

// Memory storage for S3 uploads (files have buffer; backend uploads to S3 and stores URL in documents table)
var uploadAssetsMemory = exports.uploadAssetsMemory = (0, _multer["default"])({
  storage: _multer["default"].memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter: imageFilter
});

// Catalog upload: PDF, Excel, images (for supplier catalogs stored in S3)
var catalogFilter = function catalogFilter(_req, file, cb) {
  var allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("File type ".concat(file.mimetype, " not allowed. Use PDF, Excel, or images.")), false);
  }
};
var uploadCatalogMemory = exports.uploadCatalogMemory = (0, _multer["default"])({
  storage: _multer["default"].memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024
  },
  // 15MB for catalogs
  fileFilter: catalogFilter
});

// PO / billing entry attachments: images, PDF, Excel (same S3 flow as document upload)
var PO_BILLING_EXCEL_MIMES = new Set(['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']);
var poBillingAttachmentFilter = function poBillingAttachmentFilter(_req, file, cb) {
  if (/^image\//i.test(file.mimetype) || file.mimetype === 'application/pdf' || PO_BILLING_EXCEL_MIMES.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only images, PDF, and Excel files are allowed'), false);
  }
};
var uploadPoBillingAttachmentMemory = exports.uploadPoBillingAttachmentMemory = (0, _multer["default"])({
  storage: _multer["default"].memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024
  },
  fileFilter: poBillingAttachmentFilter
});