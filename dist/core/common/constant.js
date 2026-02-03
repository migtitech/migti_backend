"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.urls = exports.statusCodes = exports.moduleName = exports.fileTypesFolderNames = exports.externalAPI = exports.errorCodes = exports.documentTypes = exports.database_urls = exports.courseTypes = exports.checkRole = exports.USER_ROLES = exports.SchemaTypes = exports.NOTIFICATION_TYPES = exports.NOTIFICATION_PRIORITY = exports.Message = exports.EVENT_CODE_PREFIX = exports.EMAIL_CONFIG = exports.DocumentPath = void 0;
var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));
require("dotenv/config");
var _nodeProcess = _interopRequireDefault(require("node:process"));
var _process$env, _process$env2, _process$env3, _process$env4, _process$env5, _Message;
/* eslint-disable no-dupe-keys */
var database_urls = exports.database_urls = Object.freeze({
  connection: ((_process$env = _nodeProcess["default"].env) === null || _process$env === void 0 ? void 0 : _process$env.DB_URL) || 'mongodb://127.0.0.1:27017/',
  db_name: ((_process$env2 = _nodeProcess["default"].env) === null || _process$env2 === void 0 ? void 0 : _process$env2.DB_NAME) || 'heyreach'
});

// Event code prefix (configurable via env, defaults to 'GCA')
var EVENT_CODE_PREFIX = exports.EVENT_CODE_PREFIX = ((_process$env3 = _nodeProcess["default"].env) === null || _process$env3 === void 0 ? void 0 : _process$env3.EVENT_CODE_PREFIX) || 'GCA';

// Email control configuration
var EMAIL_CONFIG = exports.EMAIL_CONFIG = Object.freeze({
  enabled: ((_process$env4 = _nodeProcess["default"].env) === null || _process$env4 === void 0 ? void 0 : _process$env4.EMAIL_ENABLED) !== 'false',
  // Default to true, set to 'false' to disable
  from: ((_process$env5 = _nodeProcess["default"].env) === null || _process$env5 === void 0 ? void 0 : _process$env5.EMAIL_FROM) || 'info@globalculinaryalliance.com'
});
var statusCodes = exports.statusCodes = {
  ok: 200,
  created: 201,
  accepted: 202,
  noContent: 204,
  movedPermanently: 301,
  found: 302,
  notModified: 304,
  badRequest: 400,
  unauthorized: 401,
  forbidden: 403,
  notFound: 404,
  methodNotAllowed: 405,
  conflict: 409,
  internalServerError: 500,
  notImplemented: 501,
  badGateway: 502,
  serviceUnavailable: 503
};
var Message = exports.Message = (_Message = {
  notFound: 'Not Found',
  userAlreadyInSession: 'User already exists in this session',
  caseNotFound: 'Case Not Found',
  registerSuccessfully: 'Successfully Registered',
  inValid: 'Invalid Credentials',
  successfullyUpdate: 'Updated Successfully',
  alreadyExist: 'Already Exist',
  userNotFound: 'User Not Found',
  sessionNotFound: 'Sesion Not Found',
  userNotGet: 'Fetching Error User',
  slot_unavailable: 'Slot Not Available',
  notCreated: 'Not Created',
  courseAlreadyPurchased: 'Course Already Purchased',
  invalidServiceId: 'Invalid Service ID',
  notUpdated: ' Not Updated',
  notDeleted: ' Not Deleted',
  notRegistered: 'User Not Registered',
  wrongPassword: 'Wrong Password',
  loginSuccessfully: 'Login Successfully',
  loginError: 'Login Error',
  notUpdate: 'Update Failed',
  serverError: 'Internal Server Error',
  emailNotFound: 'Invalid Email Address',
  missingRequiredFields: 'Missing required fields',
  emailAlreadyRegistered: 'Email Already Registered',
  phoneNumberAlreadyRegistered: 'Phone Number Already Registered',
  userIdNotFound: 'User Id Not Found'
}, (0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])(_Message, "userNotFound", 'User Not Found'), "userNotUpdated", 'User could not be updated'), "passValidityExpired", 'Pass Validity Expired Please Renew for Access '), "passValidityPerDayExpired", "Today's Pass Limit Reached."), "passNotFound", 'Pass Not Found'), "visitHistoryNotCreated", 'Visitor History Not Created'), "apnStatusNotUpdated", 'Appointment Status not Updated'), "incorrrectPassword", 'Incorrect Password'), "inValidData", 'Invalid Data'), "duplicateData", 'Duplicate Visitor Data'), (0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])(_Message, "serviceNotUpdated", 'Service could not be updated'), "TagIDRequired", 'TagID Required'), "validationError", 'Validation Error'), "videoAlreadyExist", 'Video already exist'), "otpExpired", 'OTP Expired'), "invalidOtp", 'Invalid OTP'), "adminCreated", 'Admin created successfully'), "judgeCreated", 'Judge created successfully'), "judgeUpdated", 'Judge updated successfully'), "judgeDeleted", 'Judge deleted successfully'), (0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])(_Message, "judgesRetrieved", 'Judges retrieved successfully'), "judgeRetrieved", 'Judge retrieved successfully'), "judgeNotFound", 'Judge not found'), "quizResponseAdded", ' Quiz submited successfully'), "documentUploaded", 'Document uploaded successfully'), "documentUploadFailed", 'Document upload failed:'), "eventCreated", 'Event created successfully'), "eventUpdated", 'Event updated successfully'), "eventDeleted", 'Event deleted successfully'), "eventReset", 'Event reset successfully'), (0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])(_Message, "eventsRetrieved", 'Events retrieved successfully'), "eventRetrieved", 'Event retrieved successfully'), "eventNotFound", 'Event not found'), "eventBannerImageUpdated", 'Event banner image updated successfully'), "eventBannerImageUploadFailed", 'Event banner image upload failed'), "judgesAssignedToEvent", 'Judges assigned to event successfully'), "sponsorsAssignedToEvent", 'Sponsors assigned to event successfully'), "eventRulesCreated", 'Event rules created successfully'), "eventRulesUpdated", 'Event rules updated successfully'), "eventRulesDeleted", 'Event rules deleted successfully'), (0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])(_Message, "eventRulesRetrieved", 'Event rules retrieved successfully'), "eventRulesNotFound", 'Event rules not found'), "noEventRulesFound", 'No event rules found'), "eventSponsorCreated", 'Event sponsor created successfully'), "eventSponsorUpdated", 'Event sponsor updated successfully'), "eventSponsorDeleted", 'Event sponsor deleted successfully'), "eventSponsorsRetrieved", 'Event sponsors retrieved successfully'), "eventSponsorRetrieved", 'Event sponsor retrieved successfully'), "eventSponsorNotFound", 'Event sponsor not found'), "questionCreated", 'Question created successfully'), (0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])(_Message, "questionsRetrieved", 'Questions retrieved successfully'), "questionNotFound", 'Question not found'), "questionPositionAlreadyExists", 'Question position already exists for this event'), "subquestionCreated", 'Subquestion created successfully'), "subquestionsRetrieved", 'Subquestions retrieved successfully'), "subquestionNotFound", 'Subquestion not found'), "judgingSubmissionCreated", 'Judging submission created successfully'), "judgingSubmissionsRetrieved", 'Judging submissions retrieved successfully'), "judgingSubmissionNotFound", 'Judging submission not found'), "teamCreated", 'Team created successfully'), (0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])(_Message, "teamCreatedAndAddedToEvent", 'Team created successfully and added to the event'), "teamNotFound", 'Team not found'), "teamAlreadyExists", 'Team with this email already exists'), "userRetrievedSuccessfully", 'User retrieved successfully'), "userNotFoundInAnyTable", 'User not found in any user table'), "emailNoteCreated", 'Email note created successfully'), "judgingRoundStatusRetrieved", 'Judging round status retrieved successfully'), "eventStartTimeNotSet", 'Event start time not set'), "emailDisabled", 'Email sending is currently disabled'), "emailSentSuccessfully", 'Email sent successfully'), (0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])(_Message, "emailQueuedSuccessfully", 'Email queued successfully'), "teamDishCreated", 'Team dish created successfully'), "teamDishUpdated", 'Team dish updated successfully'), "teamDishDeleted", 'Team dish deleted successfully'), "teamDishesRetrieved", 'Team dishes retrieved successfully'), "teamDishRetrieved", 'Team dish retrieved successfully'), "teamDishNotFound", 'Team dish not found'), "dishNameRequired", 'Dish name is required'), "dishNameMinLength", 'Dish name must be at least 2 characters long'), "dishNameMaxLength", 'Dish name cannot exceed 100 characters'), (0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])(_Message, "dishDescriptionMaxLength", 'Dish description cannot exceed 500 characters'), "preparationTimeMin", 'Preparation time must be at least 1 minute'), "preparationTimeMax", 'Preparation time cannot exceed 480 minutes'), "invalidDifficultyLevel", 'Difficulty level must be Easy, Medium, or Hard'), "categoryMaxLength", 'Category cannot exceed 50 characters'), "servingSizeMin", 'Serving size must be at least 1'), "servingSizeMax", 'Serving size cannot exceed 20'), "ingredientNameRequired", 'Ingredient name is required'), "ingredientNameMaxLength", 'Ingredient name cannot exceed 50 characters'), "ingredientQuantityMaxLength", 'Ingredient quantity cannot exceed 20 characters'), (0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])(_Message, "ingredientUnitMaxLength", 'Ingredient unit cannot exceed 20 characters'), "maxIngredientsAllowed", 'Maximum 20 ingredients allowed'), "cookingMethodMaxLength", 'Cooking method cannot exceed 100 characters'), "specialNotesMaxLength", 'Special notes cannot exceed 200 characters'), "orderMin", 'Order must be at least 1'), "orderMax", 'Order cannot exceed 10'), "dishIdRequired", 'Dish ID is required'), "teamIdRequired", 'Team ID is required'), "eventIdRequired", 'Event ID is required'), "judgeIdRequired", 'Judge ID is required'), (0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])(_Message, "questionIdRequired", 'Question ID is required'), "pointRequired", 'Point is required'), "pointMin", 'Point must be at least 0'), "pointMax", 'Point cannot exceed 100'), "commentMaxLength", 'Comment cannot exceed 500 characters'), "subquestionIdRequired", 'Subquestion ID is required'), "isacceptRequired", 'Acceptance status is required'), "invalidSubquestionAnswers", 'Invalid subquestion answers format'), "pageMin", 'Page must be at least 1'), "limitMin", 'Limit must be at least 1'), (0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])(_Message, "limitMax", 'Limit cannot exceed 100'), "emailDisabled", 'Email sending is currently disabled'), "emailSentSuccessfully", 'Email sent successfully'), "emailQueuedSuccessfully", 'Email queued successfully'), "success", 'Success'));
var errorCodes = exports.errorCodes = Object.freeze((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])((0, _defineProperty2["default"])({
  already_exist: 'ALREADY_EXIST',
  invalid_input: 'INVALID_INPUT',
  not_found: 'NOT_FOUND',
  unauthorized: 'UNAUTHORIZED',
  forbidden: 'FORBIDDEN',
  server_error: 'SERVER_ERROR',
  service_unavailable: 'SERVICE_UNAVAILABLE',
  timeout: 'TIMEOUT',
  conflict: 'CONFLICT',
  bad_request: 'BAD_REQUEST',
  precondition_failed: 'PRECONDITION_FAILED',
  payment_required: 'PAYMENT_REQUIRED',
  method_not_allowed: 'METHOD_NOT_ALLOWED',
  not_acceptable: 'NOT_ACCEPTABLE',
  request_too_large: 'REQUEST_TOO_LARGE',
  internal_error: 'INTERNAL_ERROR',
  unsupported_media_type: 'UNSUPPORTED_MEDIA_TYPE',
  too_many_requests: 'TOO_MANY_REQUESTS',
  gone: 'GONE',
  unauthorized_access: 'UNAUTHORIZED_ACCESS',
  account_locked: 'ACCOUNT_LOCKED',
  account_disabled: 'ACCOUNT_DISABLED',
  insufficient_permissions: 'INSUFFICIENT_PERMISSIONS',
  operation_failed: 'OPERATION_FAILED',
  invalid_token: 'INVALID_TOKEN',
  expired_token: 'EXPIRED_TOKEN',
  missing_auth_token: 'MISSING_AUTH_TOKEN',
  already_verified: 'ALREADY_VERIFIED',
  access_denied: 'ACCESS_DENIED',
  user_exists: 'USER_EXISTS',
  email_already_registered: 'EMAIL_ALREADY_REGISTERED',
  phone_number_already_registered: 'PHONE_NUMBER_ALREADY_REGISTERED',
  password_mismatch: 'PASSWORD_MISMATCH',
  resource_unavailable: 'RESOURCE_UNAVAILABLE',
  quota_exceeded: 'QUOTA_EXCEEDED',
  action_not_allowed: 'ACTION_NOT_ALLOWED',
  database_error: 'DATABASE_ERROR',
  invalid_session: 'INVALID_SESSION',
  invalid_request: 'INVALID_REQUEST',
  invalid_credentials: 'INVALID_CREDENTIALS',
  operation_timeout: 'OPERATION_TIMEOUT',
  validation_error: 'VALIDATION_ERROR',
  rate_limit_exceeded: 'RATE_LIMIT_EXCEEDED',
  not_implemented: 'NOT_IMPLEMENTED',
  unsupported_operation: 'UNSUPPORTED_OPERATION',
  invalid_format: 'INVALID_FORMAT',
  service_busy: 'SERVICE_BUSY',
  network_error: 'NETWORK_ERROR',
  system_error: 'SYSTEM_ERROR',
  user_not_found: 'USER_NOT_FOUND',
  resource_locked: 'RESOURCE_LOCKED',
  insufficient_balance: 'INSUFFICIENT_BALANCE',
  transaction_failed: 'TRANSACTION_FAILED',
  invalid_parameters: 'INVALID_PARAMETERS',
  action_failed: 'ACTION_FAILED',
  operation_not_supported: 'OPERATION_NOT_SUPPORTED',
  missing_parameters: 'MISSING_PARAMETERS',
  file_not_found: 'FILE_NOT_FOUND',
  file_too_large: 'FILE_TOO_LARGE',
  malformed_request: 'MALFORMED_REQUEST',
  authentication_required: 'AUTHENTICATION_REQUIRED',
  access_forbidden: 'ACCESS_FORBIDDEN',
  not_permitted: 'NOT_PERMITTED',
  invalid_email: 'INVALID_EMAIL',
  password_too_weak: 'PASSWORD_TOO_WEAK',
  email_not_verified: 'EMAIL_NOT_VERIFIED',
  action_not_found: 'ACTION_NOT_FOUND',
  resource_not_found: 'RESOURCE_NOT_FOUND',
  failed_dependency: 'FAILED_DEPENDENCY',
  locked_account: 'LOCKED_ACCOUNT',
  user_not_active: 'USER_NOT_ACTIVE',
  already_subscribed: 'ALREADY_SUBSCRIBED',
  subscription_expired: 'SUBSCRIPTION_EXPIRED',
  request_failed: 'REQUEST_FAILED',
  invalid_api_key: 'INVALID_API_KEY',
  api_limit_exceeded: 'API_LIMIT_EXCEEDED',
  invalid_authentication: 'INVALID_AUTHENTICATION',
  method_not_accepted: 'METHOD_NOT_ACCEPTED',
  entity_not_found: 'ENTITY_NOT_FOUND',
  feature_disabled: 'FEATURE_DISABLED'
}, "missing_auth_token", 'MISSING_AUTH_TOKEN'), "invalid_operation", 'INVALID_OPERATION'), "not_created", 'NOT_CREATED'), "pass_expire", 'Pass Validity Expired'), "not_updated", 'NOT_UPDATED'), "already_purchased", 'ALREADY_PURCHASED'), "invalid_otp", 'INVALID_OTP'), "otp_expired", 'OTP_EXPIRED'));
var urls = exports.urls = {
  success: "".concat(_nodeProcess["default"].env.FE_URL, "/dashboard/payment/success"),
  cancel: "".concat(_nodeProcess["default"].env.FE_URL, "/dashboard/upgradepackage")
};
var externalAPI = exports.externalAPI = {
  district: "https://api.census.gov/data/2020/dec/pl?get=NAME&for=place:*&in=state:*"
};
var fileTypesFolderNames = exports.fileTypesFolderNames = {
  thumbnail: 'thumbnails',
  video: 'videos',
  slider: 'sliders'
};
var moduleName = exports.moduleName = Object.freeze({
  chapter: 'chapter',
  course: 'course',
  slider: 'slider'
});
var documentTypes = exports.documentTypes = Object.freeze({
  thumbnail: 'thumbnail',
  video: 'video'
});
var courseTypes = exports.courseTypes = Object.freeze({
  free: 'free',
  paid: 'paid',
  web_series: 'web_series'
});

// Schema Types
var SchemaTypes = exports.SchemaTypes = Object.freeze({
  ObjectId: 'mongoose.Schema.Types.ObjectId',
  String: 'String',
  Number: 'Number',
  Date: 'Date',
  Boolean: 'Boolean',
  Array: 'Array',
  Mixed: 'mongoose.Schema.Types.Mixed'
});

// User Roles
var checkRole = exports.checkRole = Object.freeze({
  superAdmin: 'superAdmin',
  admin: 'admin',
  individual: 'individual',
  association: 'association',
  enterprise: 'enterprise',
  hr: 'hr',
  guard: 'guard',
  security: 'security',
  receptionist: 'receptionist'
});

// Role constants for login response and token payload
var USER_ROLES = exports.USER_ROLES = Object.freeze({
  INDIVIDUAL: 'individual',
  ASSOCIATION: 'association',
  ENTERPRISE: 'enterprise',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin'
});
var DocumentPath = exports.DocumentPath = Object.freeze({
  judgesPhoto: 'judges/photos',
  judgesCertifications: 'judges/certifications'
});

// Notification constants
var NOTIFICATION_TYPES = exports.NOTIFICATION_TYPES = Object.freeze({
  INFO: 'info',
  WARNING: 'warning',
  SUCCESS: 'success',
  ERROR: 'error',
  SYSTEM: 'system'
});
var NOTIFICATION_PRIORITY = exports.NOTIFICATION_PRIORITY = Object.freeze({
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
});