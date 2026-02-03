"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.resetPassword = exports.registerIndividual = exports.registerAssociation = exports.BASE_URL = void 0;
var environmentUrls = {
  development: 'https://dev.gca.user.infosparkles.net',
  production: 'https://admin.globalculinaryalliance.com'
};

// Get current environment
var currentEnv = process.env.NODE_ENV || 'development';

// Get base URL for current environment
var BASE_URL = exports.BASE_URL = environmentUrls[currentEnv] || environmentUrls.development;

// Export URL generator functions
var registerIndividual = exports.registerIndividual = function registerIndividual(referralCode) {
  return "".concat(BASE_URL, "/register-individual?referralCode=").concat(referralCode);
};
var registerAssociation = exports.registerAssociation = function registerAssociation(token) {
  return "".concat(BASE_URL, "/register-association?token=").concat(token);
};
var resetPassword = exports.resetPassword = function resetPassword(token) {
  return "".concat(BASE_URL, "/reset-password?token=").concat(token);
};