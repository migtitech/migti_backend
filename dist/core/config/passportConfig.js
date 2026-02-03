"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _passport = _interopRequireDefault(require("passport"));
var _passportJwt = require("passport-jwt");
// import process from 'node:process'

// const secretKey = process.env?.ACCESS_TOKEN_SECRET

_passport["default"].use(new _passportJwt.Strategy({
  jwtFromRequest: _passportJwt.ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: 'secretKey'
}, function (jwtPayload, done) {
  if (jwtPayload) return done(null, jwtPayload);
  return done(null, false);
}));
var _default = exports["default"] = _passport["default"];