"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.stopEmailQueue = exports.startEmailQueue = exports.sendPasswordResetSuccessEmail = exports.sendOTPEmail = exports.sendMailToUser = exports.sendIndividualWelcomeEmail = exports.sendEnterpriseWelcomeEmail = exports.sendEmailVerification = exports.sendEmail = exports.sendAssociationWelcomeEmail = void 0;
var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));
var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));
var _mail = _interopRequireDefault(require("@sendgrid/mail"));
var _forgotPasswordEmail = require("../../emailTeamplate/forgot.password.email.js");
var _welcomeAssociationEmail = require("../../emailTeamplate/welcome.association.email.js");
var _welcomeEnterpriseEmail = require("../../emailTeamplate/welcome.enterprise.email.js");
var _welcomeIndividualEmail = require("../../emailTeamplate/welcome.individual.email.js");
var _emailVerification = require("../../emailTeamplate/email.verification.js");
var _constant = require("../common/constant.js");
var _logger = _interopRequireDefault(require("../config/logger.js"));
// Initialize SendGrid with API key
_mail["default"].setApiKey(process.env.SENDGRID_API_KEY);

// Email queue to store pending emails
var emailQueue = [];
var isProcessingQueue = false;
var sendEmail = /*#__PURE__*/function () {
  var _ref = (0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee(mailOptions) {
    var msg, response, _error$response, _t;
    return _regenerator["default"].wrap(function (_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          if (_constant.EMAIL_CONFIG.enabled) {
            _context.next = 1;
            break;
          }
          _logger["default"].info("Email sending is disabled. Would have sent email to: ".concat(mailOptions.to, " with subject: ").concat(mailOptions.subject));
          return _context.abrupt("return");
        case 1:
          if (!mailOptions.from) {
            mailOptions.from = _constant.EMAIL_CONFIG.from;
          }
          _logger["default"].info('Sending email via SendGrid:', mailOptions.to, mailOptions.subject);

          // SendGrid message format
          msg = {
            to: mailOptions.to,
            from: mailOptions.from,
            subject: mailOptions.subject,
            html: mailOptions.html
          };
          _context.next = 2;
          return _mail["default"].send(msg);
        case 2:
          response = _context.sent;
          _logger["default"].info('Email sent successfully via SendGrid:', response[0].statusCode);
          _context.next = 4;
          break;
        case 3:
          _context.prev = 3;
          _t = _context["catch"](0);
          _logger["default"].error('Error sending email via SendGrid:', ((_error$response = _t.response) === null || _error$response === void 0 ? void 0 : _error$response.body) || _t.message);
        case 4:
        case "end":
          return _context.stop();
      }
    }, _callee, null, [[0, 3]]);
  }));
  return function sendEmail(_x) {
    return _ref.apply(this, arguments);
  };
}();
var processEmailQueue = /*#__PURE__*/function () {
  var _ref2 = (0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee2() {
    var queueLength, mailOptions, _t2;
    return _regenerator["default"].wrap(function (_context2) {
      while (1) switch (_context2.prev = _context2.next) {
        case 0:
          if (!(isProcessingQueue || emailQueue.length === 0)) {
            _context2.next = 1;
            break;
          }
          return _context2.abrupt("return");
        case 1:
          isProcessingQueue = true;

          // If email sending is disabled, clear the queue and log the action
          if (_constant.EMAIL_CONFIG.enabled) {
            _context2.next = 2;
            break;
          }
          queueLength = emailQueue.length;
          emailQueue.length = 0; // Clear the queue
          _logger["default"].info("Email sending is disabled. Cleared ".concat(queueLength, " emails from queue."));
          isProcessingQueue = false;
          return _context2.abrupt("return");
        case 2:
          _logger["default"].info("Processing ".concat(emailQueue.length, " emails from queue..."));
        case 3:
          if (!(emailQueue.length > 0)) {
            _context2.next = 8;
            break;
          }
          mailOptions = emailQueue.shift();
          _context2.prev = 4;
          _context2.next = 5;
          return sendEmail(mailOptions);
        case 5:
          _context2.next = 7;
          break;
        case 6:
          _context2.prev = 6;
          _t2 = _context2["catch"](4);
          _logger["default"].error('Failed to process email from queue:', _t2);
        case 7:
          _context2.next = 3;
          break;
        case 8:
          isProcessingQueue = false;
          _logger["default"].info('Email queue processing completed');
        case 9:
        case "end":
          return _context2.stop();
      }
    }, _callee2, null, [[4, 6]]);
  }));
  return function processEmailQueue() {
    return _ref2.apply(this, arguments);
  };
}();
var sendOTPEmail = exports.sendOTPEmail = /*#__PURE__*/function () {
  var _ref3 = (0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee3(email, otp) {
    var userName,
      userType,
      mailOptions,
      _args3 = arguments,
      _t3;
    return _regenerator["default"].wrap(function (_context3) {
      while (1) switch (_context3.prev = _context3.next) {
        case 0:
          userName = _args3.length > 2 && _args3[2] !== undefined ? _args3[2] : null;
          userType = _args3.length > 3 && _args3[3] !== undefined ? _args3[3] : 'user';
          _context3.prev = 1;
          if (_constant.EMAIL_CONFIG.enabled) {
            _context3.next = 2;
            break;
          }
          _logger["default"].info("Email sending is disabled. Would have sent OTP email to: ".concat(email));
          return _context3.abrupt("return", {
            status: false,
            message: _constant.Message.emailDisabled,
            disabled: true
          });
        case 2:
          mailOptions = {
            from: _constant.EMAIL_CONFIG.from,
            to: email,
            subject: 'Password Reset OTP - GCA',
            html: (0, _forgotPasswordEmail.forgotPasswordEmail)(email, otp, userName, userType)
          };
          emailQueue.push(mailOptions);
          _logger["default"].info("OTP email added to queue for ".concat(email, ". Queue length: ").concat(emailQueue.length));
          setImmediate(function () {
            processEmailQueue()["catch"](function (error) {
              _logger["default"].error('Error in queue processing:', error);
            });
          });
          return _context3.abrupt("return", {
            status: true,
            queued: true,
            queueLength: emailQueue.length,
            message: _constant.Message.emailQueuedSuccessfully
          });
        case 3:
          _context3.prev = 3;
          _t3 = _context3["catch"](1);
          _logger["default"].error('Error adding OTP email to queue:', _t3);
          return _context3.abrupt("return", {
            status: false,
            error: _t3.message
          });
        case 4:
        case "end":
          return _context3.stop();
      }
    }, _callee3, null, [[1, 3]]);
  }));
  return function sendOTPEmail(_x2, _x3) {
    return _ref3.apply(this, arguments);
  };
}();
var sendPasswordResetSuccessEmail = exports.sendPasswordResetSuccessEmail = /*#__PURE__*/function () {
  var _ref4 = (0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee4(email) {
    var userName,
      userType,
      mailOptions,
      _args4 = arguments,
      _t4;
    return _regenerator["default"].wrap(function (_context4) {
      while (1) switch (_context4.prev = _context4.next) {
        case 0:
          userName = _args4.length > 1 && _args4[1] !== undefined ? _args4[1] : null;
          userType = _args4.length > 2 && _args4[2] !== undefined ? _args4[2] : 'user';
          _context4.prev = 1;
          if (_constant.EMAIL_CONFIG.enabled) {
            _context4.next = 2;
            break;
          }
          _logger["default"].info("Email sending is disabled. Would have sent password reset success email to: ".concat(email));
          return _context4.abrupt("return", {
            status: false,
            message: _constant.Message.emailDisabled,
            disabled: true
          });
        case 2:
          mailOptions = {
            from: _constant.EMAIL_CONFIG.from,
            to: email,
            subject: 'Password Reset Successful - GCA',
            html: "\n        <div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;\">\n          <div style=\"background-color: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;\">\n            <h2 style=\"color: #28a745; margin-bottom: 20px;\">Password Reset Successful</h2>\n            <p style=\"color: #666; font-size: 16px; margin-bottom: 20px;\">\n              Hello ".concat(userName || 'User', ",\n            </p>\n            <p style=\"color: #666; font-size: 16px; margin-bottom: 30px;\">\n              Your password has been successfully reset for your ").concat(userType, " account. You can now log in with your new password.\n            </p>\n          </div>\n        </div>\n      ")
          }; // Add email to queue instead of sending immediately
          emailQueue.push(mailOptions);
          _logger["default"].info("Password reset success email added to queue for ".concat(email, ". Queue length: ").concat(emailQueue.length));

          // Process queue asynchronously (non-blocking)
          setImmediate(function () {
            processEmailQueue()["catch"](function (error) {
              _logger["default"].error('Error in queue processing:', error);
            });
          });
          return _context4.abrupt("return", {
            status: true,
            queued: true,
            queueLength: emailQueue.length,
            message: _constant.Message.emailQueuedSuccessfully
          });
        case 3:
          _context4.prev = 3;
          _t4 = _context4["catch"](1);
          _logger["default"].error('Error adding password reset success email to queue:', _t4);
          return _context4.abrupt("return", {
            status: false,
            error: _t4.message
          });
        case 4:
        case "end":
          return _context4.stop();
      }
    }, _callee4, null, [[1, 3]]);
  }));
  return function sendPasswordResetSuccessEmail(_x4) {
    return _ref4.apply(this, arguments);
  };
}();
var sendAssociationWelcomeEmail = exports.sendAssociationWelcomeEmail = /*#__PURE__*/function () {
  var _ref5 = (0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee5(associationName, contactPersonName, email) {
    var mailOptions, _t5;
    return _regenerator["default"].wrap(function (_context5) {
      while (1) switch (_context5.prev = _context5.next) {
        case 0:
          _context5.prev = 0;
          if (_constant.EMAIL_CONFIG.enabled) {
            _context5.next = 1;
            break;
          }
          _logger["default"].info("Email sending is disabled. Would have sent association welcome email to: ".concat(email));
          return _context5.abrupt("return", {
            status: false,
            message: _constant.Message.emailDisabled,
            disabled: true
          });
        case 1:
          mailOptions = {
            from: _constant.EMAIL_CONFIG.from,
            to: email,
            subject: "Welcome to GCA - ".concat(associationName),
            html: (0, _welcomeAssociationEmail.associationWelcomeEmail)(associationName, contactPersonName, email)
          }; // Add email to queue instead of sending immediately
          emailQueue.push(mailOptions);
          _logger["default"].info("Association welcome email added to queue for ".concat(email, ". Queue length: ").concat(emailQueue.length));

          // Process queue asynchronously (non-blocking)
          setImmediate(function () {
            processEmailQueue()["catch"](function (error) {
              _logger["default"].error('Error in queue processing:', error);
            });
          });
          return _context5.abrupt("return", {
            status: true,
            queued: true,
            queueLength: emailQueue.length,
            message: _constant.Message.emailQueuedSuccessfully
          });
        case 2:
          _context5.prev = 2;
          _t5 = _context5["catch"](0);
          _logger["default"].error('Error adding association welcome email to queue:', _t5);
          return _context5.abrupt("return", {
            status: false,
            error: _t5.message
          });
        case 3:
        case "end":
          return _context5.stop();
      }
    }, _callee5, null, [[0, 2]]);
  }));
  return function sendAssociationWelcomeEmail(_x5, _x6, _x7) {
    return _ref5.apply(this, arguments);
  };
}();
var sendEnterpriseWelcomeEmail = exports.sendEnterpriseWelcomeEmail = /*#__PURE__*/function () {
  var _ref6 = (0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee6(enterpriseName, contactPersonName, email) {
    var mailOptions, _t6;
    return _regenerator["default"].wrap(function (_context6) {
      while (1) switch (_context6.prev = _context6.next) {
        case 0:
          _context6.prev = 0;
          if (_constant.EMAIL_CONFIG.enabled) {
            _context6.next = 1;
            break;
          }
          _logger["default"].info("Email sending is disabled. Would have sent enterprise welcome email to: ".concat(email));
          return _context6.abrupt("return", {
            status: false,
            message: _constant.Message.emailDisabled,
            disabled: true
          });
        case 1:
          mailOptions = {
            from: _constant.EMAIL_CONFIG.from,
            to: email,
            subject: "Welcome to GCA - ".concat(enterpriseName),
            html: (0, _welcomeEnterpriseEmail.enterpriseWelcomeEmail)(enterpriseName, contactPersonName, email)
          }; // Add email to queue instead of sending immediately
          emailQueue.push(mailOptions);
          _logger["default"].info("Enterprise welcome email added to queue for ".concat(email, ". Queue length: ").concat(emailQueue.length));

          // Process queue asynchronously (non-blocking)
          setImmediate(function () {
            processEmailQueue()["catch"](function (error) {
              _logger["default"].error('Error in queue processing:', error);
            });
          });
          return _context6.abrupt("return", {
            status: true,
            queued: true,
            queueLength: emailQueue.length,
            message: _constant.Message.emailQueuedSuccessfully
          });
        case 2:
          _context6.prev = 2;
          _t6 = _context6["catch"](0);
          _logger["default"].error('Error adding enterprise welcome email to queue:', _t6);
          return _context6.abrupt("return", {
            status: false,
            error: _t6.message
          });
        case 3:
        case "end":
          return _context6.stop();
      }
    }, _callee6, null, [[0, 2]]);
  }));
  return function sendEnterpriseWelcomeEmail(_x8, _x9, _x0) {
    return _ref6.apply(this, arguments);
  };
}();
var sendIndividualWelcomeEmail = exports.sendIndividualWelcomeEmail = /*#__PURE__*/function () {
  var _ref7 = (0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee7(name, email) {
    var mailOptions, _t7;
    return _regenerator["default"].wrap(function (_context7) {
      while (1) switch (_context7.prev = _context7.next) {
        case 0:
          _context7.prev = 0;
          if (_constant.EMAIL_CONFIG.enabled) {
            _context7.next = 1;
            break;
          }
          _logger["default"].info("Email sending is disabled. Would have sent individual welcome email to: ".concat(email));
          return _context7.abrupt("return", {
            status: false,
            message: _constant.Message.emailDisabled,
            disabled: true
          });
        case 1:
          mailOptions = {
            from: _constant.EMAIL_CONFIG.from,
            to: email,
            subject: "Welcome to GCA - ".concat(name),
            html: (0, _welcomeIndividualEmail.individualWelcomeEmail)(name, email)
          }; // Add email to queue instead of sending immediately
          emailQueue.push(mailOptions);
          _logger["default"].info("Individual welcome email added to queue for ".concat(email, ". Queue length: ").concat(emailQueue.length));

          // Process queue asynchronously (non-blocking)
          setImmediate(function () {
            processEmailQueue()["catch"](function (error) {
              _logger["default"].error('Error in queue processing:', error);
            });
          });
          return _context7.abrupt("return", {
            status: true,
            queued: true,
            queueLength: emailQueue.length,
            message: _constant.Message.emailQueuedSuccessfully
          });
        case 2:
          _context7.prev = 2;
          _t7 = _context7["catch"](0);
          _logger["default"].error('Error adding individual welcome email to queue:', _t7);
          return _context7.abrupt("return", {
            status: false,
            error: _t7.message
          });
        case 3:
        case "end":
          return _context7.stop();
      }
    }, _callee7, null, [[0, 2]]);
  }));
  return function sendIndividualWelcomeEmail(_x1, _x10) {
    return _ref7.apply(this, arguments);
  };
}();
var sendEmailVerification = exports.sendEmailVerification = /*#__PURE__*/function () {
  var _ref8 = (0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee8(name, email, verificationToken) {
    var mailOptions, _t8;
    return _regenerator["default"].wrap(function (_context8) {
      while (1) switch (_context8.prev = _context8.next) {
        case 0:
          _context8.prev = 0;
          if (_constant.EMAIL_CONFIG.enabled) {
            _context8.next = 1;
            break;
          }
          _logger["default"].info("Email sending is disabled. Would have sent email verification to: ".concat(email));
          return _context8.abrupt("return", {
            status: false,
            message: _constant.Message.emailDisabled,
            disabled: true
          });
        case 1:
          mailOptions = {
            from: _constant.EMAIL_CONFIG.from,
            to: email,
            subject: 'Verify Your Email - GCA',
            html: (0, _emailVerification.emailVerificationTemplate)(name, verificationToken)
          }; // Add email to queue instead of sending immediately
          emailQueue.push(mailOptions);
          _logger["default"].info("Email verification added to queue for ".concat(email, ". Queue length: ").concat(emailQueue.length));

          // Process queue asynchronously (non-blocking)
          setImmediate(function () {
            processEmailQueue()["catch"](function (error) {
              _logger["default"].error('Error in queue processing:', error);
            });
          });
          return _context8.abrupt("return", {
            status: true,
            queued: true,
            queueLength: emailQueue.length,
            message: _constant.Message.emailQueuedSuccessfully
          });
        case 2:
          _context8.prev = 2;
          _t8 = _context8["catch"](0);
          _logger["default"].error('Error adding email verification to queue:', _t8);
          return _context8.abrupt("return", {
            status: false,
            error: _t8.message
          });
        case 3:
        case "end":
          return _context8.stop();
      }
    }, _callee8, null, [[0, 2]]);
  }));
  return function sendEmailVerification(_x11, _x12, _x13) {
    return _ref8.apply(this, arguments);
  };
}();
var sendMailToUser = exports.sendMailToUser = /*#__PURE__*/function () {
  var _ref9 = (0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee9(mailOptions) {
    var _t9;
    return _regenerator["default"].wrap(function (_context9) {
      while (1) switch (_context9.prev = _context9.next) {
        case 0:
          _context9.prev = 0;
          if (_constant.EMAIL_CONFIG.enabled) {
            _context9.next = 1;
            break;
          }
          _logger["default"].info("Email sending is disabled. Would have sent email to: ".concat(mailOptions.to || 'unknown'));
          return _context9.abrupt("return", {
            status: false,
            message: _constant.Message.emailDisabled,
            disabled: true
          });
        case 1:
          // Add email to queue instead of sending immediately
          emailQueue.push(mailOptions);
          _logger["default"].info("Email added to queue. Queue length: ".concat(emailQueue.length));

          // Process queue asynchronously (non-blocking)
          setImmediate(function () {
            processEmailQueue()["catch"](function (error) {
              _logger["default"].error('Error in queue processing:', error);
            });
          });

          // Return immediately - don't wait for email to be sent
          return _context9.abrupt("return", {
            status: true,
            queued: true,
            queueLength: emailQueue.length,
            message: _constant.Message.emailQueuedSuccessfully
          });
        case 2:
          _context9.prev = 2;
          _t9 = _context9["catch"](0);
          _logger["default"].error('Error adding email to queue:', _t9);
          return _context9.abrupt("return", {
            status: false,
            error: _t9.message
          });
        case 3:
        case "end":
          return _context9.stop();
      }
    }, _callee9, null, [[0, 2]]);
  }));
  return function sendMailToUser(_x14) {
    return _ref9.apply(this, arguments);
  };
}();

// Helper function for sending emails with simple parameters
var sendEmailSimple = exports.sendEmail = /*#__PURE__*/function () {
  var _ref0 = (0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee0(to, subject, html) {
    var mailOptions;
    return _regenerator["default"].wrap(function (_context0) {
      while (1) switch (_context0.prev = _context0.next) {
        case 0:
          mailOptions = {
            from: _constant.EMAIL_CONFIG.from,
            to: to,
            subject: subject,
            html: html
          };
          return _context0.abrupt("return", sendMailToUser(mailOptions));
        case 1:
        case "end":
          return _context0.stop();
      }
    }, _callee0);
  }));
  return function sendEmailSimple(_x15, _x16, _x17) {
    return _ref0.apply(this, arguments);
  };
}();
var startEmailQueue = exports.startEmailQueue = /*#__PURE__*/function () {
  var _ref1 = (0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee1() {
    var status;
    return _regenerator["default"].wrap(function (_context1) {
      while (1) switch (_context1.prev = _context1.next) {
        case 0:
          status = _constant.EMAIL_CONFIG.enabled ? 'enabled' : 'disabled';
          _logger["default"].info("Email queue started successfully. Email sending is ".concat(status, "."));
          return _context1.abrupt("return", true);
        case 1:
        case "end":
          return _context1.stop();
      }
    }, _callee1);
  }));
  return function startEmailQueue() {
    return _ref1.apply(this, arguments);
  };
}();
var stopEmailQueue = exports.stopEmailQueue = /*#__PURE__*/function () {
  var _ref10 = (0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee10() {
    return _regenerator["default"].wrap(function (_context10) {
      while (1) switch (_context10.prev = _context10.next) {
        case 0:
          _logger["default"].info('Email sender stopped');
          return _context10.abrupt("return", true);
        case 1:
        case "end":
          return _context10.stop();
      }
    }, _callee10);
  }));
  return function stopEmailQueue() {
    return _ref10.apply(this, arguments);
  };
}();