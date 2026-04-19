"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _express = require("express");
var _asyncWrapper = require("../../utils/asyncWrapper.js");
var _adminController = require("../../controller/admin/admin.controller.js");
var _jwtAuth = require("../../middlewares/jwtAuth.js");
var _constant = require("../../core/common/constant.js");
var adminRouter = (0, _express.Router)();
adminRouter.post('/login', (0, _asyncWrapper.asyncHandler)(_adminController.loginAdmin));
adminRouter.post('/superadmin/login', (0, _asyncWrapper.asyncHandler)(_adminController.loginSuperAdmin));
adminRouter.post('/create', _jwtAuth.authenticateToken, (0, _asyncWrapper.asyncHandler)(_adminController.createAdmin));
adminRouter.get('/list', _jwtAuth.authenticateToken, (0, _asyncWrapper.asyncHandler)(_adminController.listAdmin));
adminRouter.get('/get-by-id', _jwtAuth.authenticateToken, (0, _asyncWrapper.asyncHandler)(_adminController.getAdminByIdController));
adminRouter.put('/update', _jwtAuth.authenticateToken, (0, _asyncWrapper.asyncHandler)(_adminController.updateAdmin));
adminRouter.put('/update-access', _jwtAuth.authenticateToken, (0, _asyncWrapper.asyncHandler)(_adminController.updateAdminAccessController));
adminRouter["delete"]('/delete', _jwtAuth.authenticateToken, (0, _asyncWrapper.asyncHandler)(_adminController.deleteAdminController));

// RBAC: Get all available modules and actions for the permissions UI
adminRouter.get('/permissions/modules', _jwtAuth.authenticateToken, function (req, res) {
  res.status(200).json({
    success: true,
    message: 'Modules retrieved successfully',
    data: {
      modules: _constant.MODULE_LIST,
      actions: Object.values(_constant.ACTIONS)
    }
  });
});
var _default = exports["default"] = adminRouter;