"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.stopAgenda = exports.startAgenda = exports.agenda = exports.addLoyaltyPointsToQueue = void 0;
var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));
var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));
var _agenda = _interopRequireDefault(require("agenda"));
var _individualUserModel = _interopRequireDefault(require("../../models/individualUser.model.js"));
var _constant = require("../common/constant.js");
var _exception = _interopRequireDefault(require("../../utils/exception.js"));
var agenda = exports.agenda = new _agenda["default"]({
  db: {
    address: 'mongodb+srv://prod:GCA10102025@gca.tjsqzuq.mongodb.net/gca_prod?retryWrites=true&w=majority&appName=gcaCluster&authSource=admin',
    collection: 'agendaJobs'
  },
  processEvery: '10 seconds'
});
agenda.define('add-loyalty-points', /*#__PURE__*/function () {
  var _ref = (0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee(job) {
    var _job$attrs$data, referrerUserId, points, referrerUser, updatedUser, _t;
    return _regenerator["default"].wrap(function (_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          _job$attrs$data = job.attrs.data, referrerUserId = _job$attrs$data.referrerUserId, points = _job$attrs$data.points;
          _context.next = 1;
          return _individualUserModel["default"].findById(referrerUserId);
        case 1:
          referrerUser = _context.sent;
          if (referrerUser) {
            _context.next = 2;
            break;
          }
          console.error("Referrer user not found: ".concat(referrerUserId));
          return _context.abrupt("return");
        case 2:
          _context.next = 3;
          return _individualUserModel["default"].findByIdAndUpdate(referrerUserId, {
            $inc: {
              loyaltyPoints: points
            }
          }, {
            "new": true
          }).select('-password');
        case 3:
          updatedUser = _context.sent;
          _context.next = 5;
          break;
        case 4:
          _context.prev = 4;
          _t = _context["catch"](0);
          console.error('Error processing loyalty points:', _t);
          throw _t;
        case 5:
        case "end":
          return _context.stop();
      }
    }, _callee, null, [[0, 4]]);
  }));
  return function (_x) {
    return _ref.apply(this, arguments);
  };
}());
var startAgenda = exports.startAgenda = /*#__PURE__*/function () {
  var _ref2 = (0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee2() {
    var _t2;
    return _regenerator["default"].wrap(function (_context2) {
      while (1) switch (_context2.prev = _context2.next) {
        case 0:
          _context2.prev = 0;
          _context2.next = 1;
          return agenda.start();
        case 1:
          console.log('Agenda queue started successfully');
          _context2.next = 3;
          break;
        case 2:
          _context2.prev = 2;
          _t2 = _context2["catch"](0);
          console.error('Failed to start Agenda:', _t2);
          throw _t2;
        case 3:
        case "end":
          return _context2.stop();
      }
    }, _callee2, null, [[0, 2]]);
  }));
  return function startAgenda() {
    return _ref2.apply(this, arguments);
  };
}();
var stopAgenda = exports.stopAgenda = /*#__PURE__*/function () {
  var _ref3 = (0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee3() {
    var _t3;
    return _regenerator["default"].wrap(function (_context3) {
      while (1) switch (_context3.prev = _context3.next) {
        case 0:
          _context3.prev = 0;
          _context3.next = 1;
          return agenda.stop();
        case 1:
          console.log('Agenda queue stopped successfully');
          _context3.next = 3;
          break;
        case 2:
          _context3.prev = 2;
          _t3 = _context3["catch"](0);
          console.error('Error stopping Agenda:', _t3);
        case 3:
        case "end":
          return _context3.stop();
      }
    }, _callee3, null, [[0, 2]]);
  }));
  return function stopAgenda() {
    return _ref3.apply(this, arguments);
  };
}();
var addLoyaltyPointsToQueue = exports.addLoyaltyPointsToQueue = /*#__PURE__*/function () {
  var _ref4 = (0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee4(referrerUserId) {
    var points,
      _args4 = arguments,
      _t4;
    return _regenerator["default"].wrap(function (_context4) {
      while (1) switch (_context4.prev = _context4.next) {
        case 0:
          points = _args4.length > 1 && _args4[1] !== undefined ? _args4[1] : 10;
          _context4.prev = 1;
          if (referrerUserId) {
            _context4.next = 2;
            break;
          }
          throw new _exception["default"](_constant.statusCodes.badRequest, 'Referrer user ID is required', _constant.errorCodes.validation_error);
        case 2:
          _context4.next = 3;
          return agenda.now('add-loyalty-points', {
            referrerUserId: referrerUserId,
            points: points
          });
        case 3:
          console.log("Added loyalty points job to queue for user: ".concat(referrerUserId));
          _context4.next = 5;
          break;
        case 4:
          _context4.prev = 4;
          _t4 = _context4["catch"](1);
          console.error('Error adding loyalty points to queue:', _t4);
          throw _t4;
        case 5:
        case "end":
          return _context4.stop();
      }
    }, _callee4, null, [[1, 4]]);
  }));
  return function addLoyaltyPointsToQueue(_x2) {
    return _ref4.apply(this, arguments);
  };
}();