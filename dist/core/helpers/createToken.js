"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createToken = void 0;
var _jsonwebtoken = _interopRequireDefault(require("jsonwebtoken"));
var createToken = exports.createToken = function createToken(payload, secretKey, expiresIn) {
  return _jsonwebtoken["default"].sign({
    payload: payload
  }, secretKey, {
    expiresIn: expiresIn
  });
};