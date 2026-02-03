"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getQueueStatus = exports["default"] = exports.clearNotificationQueue = exports.addNotification = exports.addBatchNotifications = void 0;
var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));
var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));
var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _notificationModel = _interopRequireDefault(require("../../models/notification.model.js"));
var _constant = require("../common/constant.js");
var _exception = _interopRequireDefault(require("../../utils/exception.js"));
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { (0, _defineProperty2["default"])(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
var NotificationQueue = /*#__PURE__*/function () {
  function NotificationQueue() {
    (0, _classCallCheck2["default"])(this, NotificationQueue);
    this.queue = [];
    this.isProcessing = false;
  }

  // Add notification to queue
  return (0, _createClass2["default"])(NotificationQueue, [{
    key: "addToQueue",
    value: function addToQueue(notificationData) {
      this.queue.push(_objectSpread(_objectSpread({}, notificationData), {}, {
        timestamp: new Date()
      }));

      // Process queue if not already processing
      if (!this.isProcessing) {
        this.processQueue();
      }
    }

    // Process the notification queue
  }, {
    key: "processQueue",
    value: function () {
      var _processQueue = (0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee() {
        var notificationData, _t;
        return _regenerator["default"].wrap(function (_context) {
          while (1) switch (_context.prev = _context.next) {
            case 0:
              if (!(this.isProcessing || this.queue.length === 0)) {
                _context.next = 1;
                break;
              }
              return _context.abrupt("return");
            case 1:
              this.isProcessing = true;
            case 2:
              if (!(this.queue.length > 0)) {
                _context.next = 7;
                break;
              }
              notificationData = this.queue.shift();
              _context.prev = 3;
              _context.next = 4;
              return this.createNotification(notificationData);
            case 4:
              _context.next = 6;
              break;
            case 5:
              _context.prev = 5;
              _t = _context["catch"](3);
              console.error('Error processing notification:', _t);
              // Optionally, you could re-queue failed notifications
            case 6:
              _context.next = 2;
              break;
            case 7:
              this.isProcessing = false;
            case 8:
            case "end":
              return _context.stop();
          }
        }, _callee, this, [[3, 5]]);
      }));
      function processQueue() {
        return _processQueue.apply(this, arguments);
      }
      return processQueue;
    }() // Create notification in database
  }, {
    key: "createNotification",
    value: function () {
      var _createNotification = (0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee2(notificationData) {
        var userId, title, description, _notificationData$typ, type, _notificationData$pri, priority, _notificationData$met, metadata, notification;
        return _regenerator["default"].wrap(function (_context2) {
          while (1) switch (_context2.prev = _context2.next) {
            case 0:
              userId = notificationData.userId, title = notificationData.title, description = notificationData.description, _notificationData$typ = notificationData.type, type = _notificationData$typ === void 0 ? 'info' : _notificationData$typ, _notificationData$pri = notificationData.priority, priority = _notificationData$pri === void 0 ? 'medium' : _notificationData$pri, _notificationData$met = notificationData.metadata, metadata = _notificationData$met === void 0 ? {} : _notificationData$met; // Validate required fields
              if (!(!userId || !title || !description)) {
                _context2.next = 1;
                break;
              }
              throw new _exception["default"](_constant.statusCodes.badRequest, 'Missing required notification fields', _constant.errorCodes.validation_error);
            case 1:
              notification = new _notificationModel["default"]({
                userId: userId,
                title: title,
                description: description,
                type: type,
                priority: priority,
                metadata: metadata
              });
              _context2.next = 2;
              return notification.save();
            case 2:
              return _context2.abrupt("return", notification);
            case 3:
            case "end":
              return _context2.stop();
          }
        }, _callee2);
      }));
      function createNotification(_x) {
        return _createNotification.apply(this, arguments);
      }
      return createNotification;
    }() // Batch create notifications
  }, {
    key: "createBatchNotifications",
    value: function () {
      var _createBatchNotifications = (0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee3(notificationsData) {
        var validNotifications, notifications;
        return _regenerator["default"].wrap(function (_context3) {
          while (1) switch (_context3.prev = _context3.next) {
            case 0:
              validNotifications = notificationsData.filter(function (notification) {
                return notification.userId && notification.title && notification.description;
              });
              if (!(validNotifications.length === 0)) {
                _context3.next = 1;
                break;
              }
              throw new _exception["default"](_constant.statusCodes.badRequest, 'No valid notifications to create', _constant.errorCodes.validation_error);
            case 1:
              _context3.next = 2;
              return _notificationModel["default"].insertMany(validNotifications);
            case 2:
              notifications = _context3.sent;
              return _context3.abrupt("return", notifications);
            case 3:
            case "end":
              return _context3.stop();
          }
        }, _callee3);
      }));
      function createBatchNotifications(_x2) {
        return _createBatchNotifications.apply(this, arguments);
      }
      return createBatchNotifications;
    }() // Get queue status
  }, {
    key: "getQueueStatus",
    value: function getQueueStatus() {
      return {
        queueLength: this.queue.length,
        isProcessing: this.isProcessing
      };
    }

    // Clear queue (for testing purposes)
  }, {
    key: "clearQueue",
    value: function clearQueue() {
      this.queue = [];
    }
  }]);
}(); // Create singleton instance
var notificationQueue = new NotificationQueue();

// Export utility functions for easy use throughout the application
var addNotification = exports.addNotification = function addNotification(notificationData) {
  notificationQueue.addToQueue(notificationData);
};
var addBatchNotifications = exports.addBatchNotifications = /*#__PURE__*/function () {
  var _ref = (0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee4(notificationsData) {
    return _regenerator["default"].wrap(function (_context4) {
      while (1) switch (_context4.prev = _context4.next) {
        case 0:
          _context4.next = 1;
          return notificationQueue.createBatchNotifications(notificationsData);
        case 1:
          return _context4.abrupt("return", _context4.sent);
        case 2:
        case "end":
          return _context4.stop();
      }
    }, _callee4);
  }));
  return function addBatchNotifications(_x3) {
    return _ref.apply(this, arguments);
  };
}();
var getQueueStatus = exports.getQueueStatus = function getQueueStatus() {
  return notificationQueue.getQueueStatus();
};
var clearNotificationQueue = exports.clearNotificationQueue = function clearNotificationQueue() {
  notificationQueue.clearQueue();
};
var _default = exports["default"] = notificationQueue;