"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));
var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));
var _mongoose = _interopRequireDefault(require("mongoose"));
var connectDB = /*#__PURE__*/function () {
  var _ref = (0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee() {
    var dbenv, connectionOptions, _t;
    return _regenerator["default"].wrap(function (_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          dbenv = {
            dev: 'mongodb+srv://anuradhamigti_db_user:TypUyvWE1NxfcFJW@migticrm.1omv7mx.mongodb.net/?appName=migticrm'
          };
          connectionOptions = {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000
          };
          _context.prev = 1;
          console.log('Attempting to connect to database...');
          _context.next = 2;
          return _mongoose["default"].connect(dbenv.dev, connectionOptions);
        case 2:
          _context.next = 3;
          return new Promise(function (resolve, reject) {
            if (_mongoose["default"].connection.readyState === 1) {
              resolve();
            } else {
              _mongoose["default"].connection.once('open', resolve);
              _mongoose["default"].connection.once('error', reject);
            }
          });
        case 3:
          console.log('Database connected successfully');
          _context.next = 5;
          break;
        case 4:
          _context.prev = 4;
          _t = _context["catch"](1);
          console.error('Database connection error:', _t.message);
          process.exit(1);
        case 5:
        case "end":
          return _context.stop();
      }
    }, _callee, null, [[1, 4]]);
  }));
  return function connectDB() {
    return _ref.apply(this, arguments);
  };
}();
var _default = exports["default"] = connectDB;