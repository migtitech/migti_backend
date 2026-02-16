import { Router } from 'express'
import { asyncHandler } from '../utils/asyncWrapper.js'
import { authenticateToken, checkPermission } from '../middlewares/jwtAuth.js'
import { MODULES } from '../core/common/constant.js'
import {
  createAreaController,
  listAreasController,
  getAreaByIdController,
  updateAreaController,
  deleteAreaController,
} from '../controller/area/area.controller.js'

const areaRouter = Router()

areaRouter.post('/create', authenticateToken, checkPermission(MODULES.ZONES, 'create'), asyncHandler(createAreaController))
areaRouter.get('/list', authenticateToken, checkPermission(MODULES.ZONES, 'read'), asyncHandler(listAreasController))
areaRouter.get('/get-by-id', authenticateToken, checkPermission(MODULES.ZONES, 'read'), asyncHandler(getAreaByIdController))
areaRouter.put('/update', authenticateToken, checkPermission(MODULES.ZONES, 'update'), asyncHandler(updateAreaController))
areaRouter.delete('/delete', authenticateToken, checkPermission(MODULES.ZONES, 'delete'), asyncHandler(deleteAreaController))

export default areaRouter
