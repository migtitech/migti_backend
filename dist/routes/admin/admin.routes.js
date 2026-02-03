"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _express = require("express");
var _asyncWrapper = require("../../utils/asyncWrapper.js");
var _adminController = require("../../controller/admin/admin.controller.js");
// import { authenticateToken, requireAdmin } from '../../middlewares/jwtAuth.js'

var adminRouter = (0, _express.Router)();
adminRouter.post('/login', (0, _asyncWrapper.asyncHandler)(_adminController.loginAdmin));
adminRouter.post('/create', (0, _asyncWrapper.asyncHandler)(_adminController.createAdmin));
adminRouter.get('/list', (0, _asyncWrapper.asyncHandler)(_adminController.listAdmin));
adminRouter.get('/get-by-id', (0, _asyncWrapper.asyncHandler)(_adminController.getAdminByIdController));
adminRouter.put('/update', (0, _asyncWrapper.asyncHandler)(_adminController.updateAdmin));
adminRouter.put('/update-access', (0, _asyncWrapper.asyncHandler)(_adminController.updateAdminAccessController));
adminRouter["delete"]('/delete', (0, _asyncWrapper.asyncHandler)(_adminController.deleteAdminController));
var _default = exports["default"] = adminRouter;