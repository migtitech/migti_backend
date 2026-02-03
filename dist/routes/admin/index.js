"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _express = _interopRequireDefault(require("express"));
var _adminRoutes = _interopRequireDefault(require("./admin.routes.js"));
var _roleRoutes = _interopRequireDefault(require("./role.routes.js"));
var adminIndexRouter = _express["default"].Router();
adminIndexRouter.use('/admin', _adminRoutes["default"]);
adminIndexRouter.use('/admin/role', _roleRoutes["default"]);
var _default = exports["default"] = adminIndexRouter;