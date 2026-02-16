import { Router } from 'express'
import { asyncHandler } from '../utils/asyncWrapper.js'
import { authenticateToken, checkPermission } from '../middlewares/jwtAuth.js'
import { MODULES } from '../core/common/constant.js'
import {
  createGroupController,
  listGroupsController,
  getGroupByIdController,
  updateGroupController,
  deleteGroupController,
} from '../controller/group/group.controller.js'

const groupRouter = Router()

groupRouter.post('/create', authenticateToken, checkPermission(MODULES.GROUPS, 'create'), asyncHandler(createGroupController))
groupRouter.get('/list', authenticateToken, checkPermission(MODULES.GROUPS, 'read'), asyncHandler(listGroupsController))
groupRouter.get('/get-by-id', authenticateToken, checkPermission(MODULES.GROUPS, 'read'), asyncHandler(getGroupByIdController))
groupRouter.put('/update', authenticateToken, checkPermission(MODULES.GROUPS, 'update'), asyncHandler(updateGroupController))
groupRouter.delete('/delete', authenticateToken, checkPermission(MODULES.GROUPS, 'delete'), asyncHandler(deleteGroupController))

export default groupRouter
