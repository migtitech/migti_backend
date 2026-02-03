"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getTransporterConfig = exports.getMailOptions = exports.MAIL_CONFIG = exports.EMAIL_TEMPLATES = exports.EMAIL_SUBJECTS = exports.EMAIL_FIELDS = exports.AUTH_CONFIG = void 0;
var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));
var _otpEmail = require("../emailTeamplate/otp.email.js");
var _passwordResetSuccessEmail = require("../emailTeamplate/password.reset.success.email.js");
var _joinRequestEmail = require("../emailTeamplate/join.request.email.js");
var _memberInvitationEmail = require("../emailTeamplate/member.invitation.email.js");
var _customEmail = require("../emailTeamplate/custom.email.js");
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { (0, _defineProperty2["default"])(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; } /**
 * Email Configuration and Templates
 * Centralized mail options configuration for the GCA backend application
 */
var MAIL_CONFIG = exports.MAIL_CONFIG = {
  sendgrid: {
    service: 'sendgrid',
    apiKey: process.env.SENDGRID_API_KEY
  },
  smtp: {
    service: process.env.EMAIL_SERVICE || 'sendgrid',
    host: process.env.EMAIL_HOST || 'smtp.sendgrid.net',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    tls: {
      rejectUnauthorized: false
    }
  }
};
var AUTH_CONFIG = exports.AUTH_CONFIG = {
  user: process.env.EMAIL_FROM || 'info@globalculinaryalliance.com',
  pass: process.env.EMAIL_APP_PASSWORD || ''
};
var getMailOptions = exports.getMailOptions = function getMailOptions() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var defaultOptions = {
    from: process.env.EMAIL_FROM || 'info@globalculinaryalliance.com',
    encoding: 'utf-8'
  };
  return _objectSpread(_objectSpread({}, defaultOptions), options);
};

/**
 * Email templates for different use cases
 * Imported from individual template files in emailTeamplate folder
 */
var EMAIL_TEMPLATES = exports.EMAIL_TEMPLATES = {
  /**
   * OTP Email Template
   */
  sendOTP: _otpEmail.otpEmail,
  /**
   * Password Reset Success Email Template
   */
  passwordResetSuccess: _passwordResetSuccessEmail.passwordResetSuccessEmail,
  /**
   * Join Request Email Template
   */
  joinRequest: _joinRequestEmail.joinRequestEmail,
  /**
   * Member Invitation Email Template
   */
  memberInvitation: _memberInvitationEmail.memberInvitationEmail,
  /**
   * Custom Email Template with subject and content
   */
  custom: _customEmail.customEmail
};
var getTransporterConfig = exports.getTransporterConfig = function getTransporterConfig() {
  var emailService = process.env.EMAIL_SERVICE || 'sendgrid';
  if (emailService === 'sendgrid') {
    return _objectSpread({}, MAIL_CONFIG.sendgrid);
  }
  return _objectSpread(_objectSpread({}, MAIL_CONFIG.smtp), {}, {
    auth: AUTH_CONFIG
  });
};
var EMAIL_SUBJECTS = exports.EMAIL_SUBJECTS = {
  OTP_RESET: 'Password Reset OTP - GCA',
  PASSWORD_RESET_SUCCESS: 'Password Reset Successful - GCA',
  JOIN_REQUEST: 'Join Request - Global Culinary Alliance',
  NOTIFICATION: 'Notification - Global Culinary Alliance',
  TEAM_INVITATION: 'Team Invitation - GCA',
  WELCOME: 'Welcome to Global Culinary Alliance',
  MEMBER_INVITATION: 'Invitation to Join Association - Member Portal'
};
var EMAIL_FIELDS = exports.EMAIL_FIELDS = {
  USER_NAME: 'userName',
  USER_TYPE: 'userType',
  EMAIL: 'email',
  OTP: 'otp',
  TEAM_NAME: 'teamName',
  EVENT_NAME: 'eventName',
  FULL_NAME: 'fullName',
  LANGUAGE: 'language',
  USER_TYPE_SELECT: 'type'
};