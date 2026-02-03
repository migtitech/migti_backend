"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _express = require("express");
var _asyncWrapper = require("../../utils/asyncWrapper.js");
var _roleController = require("../../controller/admin/role.controller.js");
var roleRouter = (0, _express.Router)();
roleRouter.post('/create', (0, _asyncWrapper.asyncHandler)(_roleController.createRoleController));
roleRouter.get('/list', (0, _asyncWrapper.asyncHandler)(_roleController.listRolesController));
roleRouter.get('/get-by-id', (0, _asyncWrapper.asyncHandler)(_roleController.getRoleByIdController));
roleRouter.put('/update', (0, _asyncWrapper.asyncHandler)(_roleController.updateRoleController));
roleRouter["delete"]('/delete', (0, _asyncWrapper.asyncHandler)(_roleController.deleteRoleController));
var _default = exports["default"] = roleRouter;