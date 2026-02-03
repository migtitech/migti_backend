"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.decrypt = decrypt;
exports.encrypt = encrypt;
var _crypto = _interopRequireDefault(require("crypto"));
var algorithm = 'aes-256-ecb';
var secret = 'ABCDEFGHIJKLMNOPQRSTUVWXZY123456';
var key = Buffer.from(secret, 'utf8');
function encrypt(text) {
  var cipher = _crypto["default"].createCipheriv(algorithm, key, null);
  var encrypted = cipher.update(text, 'utf8', 'base64');
  encrypted += cipher["final"]('base64');
  return encrypted;
}
function decrypt(encrypted) {
  var decipher = _crypto["default"].createDecipheriv(algorithm, key, null);
  var decrypted = decipher.update(encrypted, 'base64', 'utf8');
  decrypted += decipher["final"]('utf8');
  return decrypted;
}