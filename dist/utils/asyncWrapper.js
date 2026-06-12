"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.asyncHandler = void 0;
var asyncHandler = exports.asyncHandler = function asyncHandler(requestHandler) {
  return function (req, res, next) {
    Promise.resolve(requestHandler(req, res, next))["catch"](next);
  };
};