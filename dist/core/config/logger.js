"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _typeof = require("@babel/runtime/helpers/typeof");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));
var _winston = _interopRequireWildcard(require("winston"));
var _winstonDailyRotateFile = _interopRequireDefault(require("winston-daily-rotate-file"));
var _nodeProcess = _interopRequireDefault(require("node:process"));
var _process$env;
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, "default": e }; if (null === e || "object" != _typeof(e) && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (var _t in e) "default" !== _t && {}.hasOwnProperty.call(e, _t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, _t)) && (i.get || i.set) ? o(f, _t, i) : f[_t] = e[_t]); return f; })(e, t); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { (0, _defineProperty2["default"])(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
var customLogFormat = _winston.format.combine(_winston.format.timestamp({
  format: 'YYYY-MM-DD HH:mm:ss'
}), _winston.format.errors({
  stack: true
}), _winston.format.splat(), _winston.format.printf(function (info) {
  return "".concat(info.timestamp, " [").concat(info.level.toUpperCase(), "] ").concat(info.message, " ").concat(info.stack ? "\n".concat(info.stack) : '');
}));
var logLevel = ((_process$env = _nodeProcess["default"].env) === null || _process$env === void 0 ? void 0 : _process$env.NODE_ENV) === 'production' ? 'info' : 'debug';
var logger = _winston["default"].createLogger({
  level: logLevel,
  format: customLogFormat,
  defaultMeta: {
    service: 'your-service-name'
  },
  transports: [new _winston["default"].transports.Console({
    format: _winston["default"].format.combine(_winston["default"].format.colorize(), _winston.format.simple())
  }), new _winstonDailyRotateFile["default"]({
    filename: 'logs/%DATE%-application.log',
    datePattern: 'YYYY-MM-DD',
    maxFiles: '30d',
    zippedArchive: true
  }), new _winstonDailyRotateFile["default"]({
    filename: 'logs/%DATE%-error.log',
    level: 'error',
    datePattern: 'YYYY-MM-DD',
    maxFiles: '30d',
    zippedArchive: true
  })]
});
logger.requestContext = function (req, res, next) {
  logger.defaultMeta = _objectSpread(_objectSpread({}, logger.defaultMeta), {}, {
    requestId: req.headers['x-request-id'] || req.id,
    user: req.user || 'anonymous'
  });
  next();
};
var _default = exports["default"] = logger;