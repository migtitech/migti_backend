"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _express = _interopRequireDefault(require("express"));
var _index = _interopRequireDefault(require("./admin/index.js"));
var mainRoutes = _express["default"].Router();
mainRoutes.use(function (req, res, next) {
  console.log("Main Routes - ".concat(req.method, " ").concat(req.originalUrl));
  next();
});
mainRoutes.get('/test', function (req, res) {
  res.json({
    success: true,
    message: 'API is working',
    data: {
      timestamp: new Date().toISOString(),
      routes: ['/v1/admin']
    }
  });
});
mainRoutes.use('/v1', _index["default"]);
var _default = exports["default"] = mainRoutes;