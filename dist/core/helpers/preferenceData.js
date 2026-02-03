"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.seedPreferences = void 0;
var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));
var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));
// Seed preferences data for user signup preferences
var seedPreferences = exports.seedPreferences = /*#__PURE__*/function () {
  var _ref = (0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee(PreferenceMasterModel) {
    var existingPreferences, preferences, insertedPreferences, _t;
    return _regenerator["default"].wrap(function (_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          _context.next = 1;
          return PreferenceMasterModel.countDocuments();
        case 1:
          existingPreferences = _context.sent;
          if (!(existingPreferences > 0)) {
            _context.next = 2;
            break;
          }
          return _context.abrupt("return", {
            success: true,
            message: 'Preferences already exist in database',
            data: {
              count: existingPreferences
            }
          });
        case 2:
          // Define 10 essential GCA preferences for signup
          preferences = [
          // Communication
          {
            preferenceTitle: 'Email Notifications',
            type: 'communication',
            radio: ['Daily', 'Weekly', 'Monthly', 'Never']
          }, {
            preferenceTitle: 'SMS Notifications',
            type: 'communication',
            radio: ['Enabled', 'Disabled']
          }, {
            preferenceTitle: 'Push Notifications',
            type: 'communication',
            radio: ['All', 'Important Only', 'Off']
          },
          // Marketing
          {
            preferenceTitle: 'Marketing Communications',
            type: 'marketing',
            radio: ['Yes', 'No']
          }, {
            preferenceTitle: 'Newsletter Subscription',
            type: 'marketing',
            radio: ['Subscribed', 'Unsubscribed']
          },
          // Culinary & Events
          {
            preferenceTitle: 'Event Updates',
            type: 'events',
            radio: ['All Events', 'My Events Only', 'None']
          }, {
            preferenceTitle: 'Competition Alerts',
            type: 'events',
            radio: ['Immediate', 'Daily Digest', 'Weekly Digest', 'Off']
          },
          // Learning
          {
            preferenceTitle: 'Learning Material',
            type: 'learning',
            radio: ['All', 'Recommended Only', 'None']
          },
          // Social
          {
            preferenceTitle: 'Team Invitations',
            type: 'social',
            radio: ['Accept All', 'Manual Review', 'Decline All']
          },
          // System
          {
            preferenceTitle: 'System Updates',
            type: 'system',
            radio: ['Enable', 'Disable']
          }];
          _context.next = 3;
          return PreferenceMasterModel.insertMany(preferences);
        case 3:
          insertedPreferences = _context.sent;
          return _context.abrupt("return", {
            success: true,
            message: 'Preferences seeded successfully',
            data: {
              count: insertedPreferences.length,
              preferences: insertedPreferences
            }
          });
        case 4:
          _context.prev = 4;
          _t = _context["catch"](0);
          console.error('Error seeding preferences:', _t);
          throw _t;
        case 5:
        case "end":
          return _context.stop();
      }
    }, _callee, null, [[0, 4]]);
  }));
  return function seedPreferences(_x) {
    return _ref.apply(this, arguments);
  };
}();