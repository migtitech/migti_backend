"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.sendMail = void 0;
var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));
var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));
var _mail = _interopRequireDefault(require("@sendgrid/mail"));
var _nodeProcess = _interopRequireDefault(require("node:process"));
var _constant = require("../common/constant.js");
var _logger = _interopRequireDefault(require("../config/logger.js"));
// Initialize SendGrid with API key
_mail["default"].setApiKey(_nodeProcess["default"].env.SENDGRID_API_KEY);
var sendMail = exports.sendMail = /*#__PURE__*/function () {
  var _ref = (0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee(mail, html) {
    var msg, _error$response, _t;
    return _regenerator["default"].wrap(function (_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          if (_constant.EMAIL_CONFIG.enabled) {
            _context.next = 1;
            break;
          }
          _logger["default"].info("Email sending is disabled. Would have sent email to: ".concat(mail));
          return _context.abrupt("return");
        case 1:
          msg = {
            from: _constant.EMAIL_CONFIG.from,
            to: mail,
            subject: 'Global Culinary Alliance',
            html: html
          };
          _context.next = 2;
          return _mail["default"].send(msg);
        case 2:
          _logger["default"].info("Email sent successfully to: ".concat(mail));
          _context.next = 4;
          break;
        case 3:
          _context.prev = 3;
          _t = _context["catch"](0);
          _logger["default"].error('Error sending email via SendGrid:', ((_error$response = _t.response) === null || _error$response === void 0 ? void 0 : _error$response.body) || _t);
        case 4:
        case "end":
          return _context.stop();
      }
    }, _callee, null, [[0, 3]]);
  }));
  return function sendMail(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();