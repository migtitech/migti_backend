"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.fineUserIdByToken = void 0;
exports.generateOTP = generateOTP;
exports.verifyToken = exports.regexFilter = void 0;
var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));
var _jsonwebtoken = _interopRequireDefault(require("jsonwebtoken"));
var regexFilter = exports.regexFilter = function regexFilter() {
  var filters = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {
    caseInsensitive: true
  };
  var result = {};
  var regexOptions = options.caseInsensitive ? 'i' : '';
  for (var _i = 0, _Object$entries = Object.entries(filters); _i < _Object$entries.length; _i++) {
    var _Object$entries$_i = (0, _slicedToArray2["default"])(_Object$entries[_i], 2),
      key = _Object$entries$_i[0],
      value = _Object$entries$_i[1];
    var trimmedValue = typeof value === 'string' ? value.trim() : null;
    if (key && trimmedValue) {
      result[key] = {
        $regex: trimmedValue,
        $options: regexOptions
      };
    }
  }
  return result;
};
var JWT_SECRET = 'JWT_SECRET';
var verifyToken = exports.verifyToken = function verifyToken(req, res, next) {
  var _req$headers;
  var authHeader = (_req$headers = req.headers) === null || _req$headers === void 0 ? void 0 : _req$headers.authorization;
  var token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).send({
      success: false,
      message: 'Access denied. No token provided.'
    });
  }
  try {
    var decoded = _jsonwebtoken["default"].verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).send({
      success: false,
      message: 'Invalid or expired token.'
    });
  }
};
function generateOTP() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}
var fineUserIdByToken = exports.fineUserIdByToken = function fineUserIdByToken(token) {
  var decoded = _jsonwebtoken["default"].verify(token, 'JWT_SECRET');
  return decoded.id;
};