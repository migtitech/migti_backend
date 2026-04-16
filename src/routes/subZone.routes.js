import { Router } from 'express'
import { asyncHandler } from '../utils/asyncWrapper.js'
import { authenticateToken, checkPermission } from '../middlewares/jwtAuth.js'
import { MODULES } from '../core/common/constant.js'
import {
  createSubZoneController,
  listSubZonesController,
  listSubZonesGroupedController,
  updateSubZoneController,
  deleteSubZoneController,
} from '../controller/subZone/subZone.controller.js'

const subZoneRouter = Router()

subZoneRouter.post(
  '/create',
  authenticateToken,
  checkPermission(MODULES.ZONES, 'create'),
  asyncHandler(createSubZoneController),
)
subZoneRouter.get(
  '/list',
  authenticateToken,
  checkPermission(MODULES.ZONES, 'read'),
  asyncHandler(listSubZonesController),
)
subZoneRouter.get(
  '/list-grouped',
  authenticateToken,
  checkPermission(MODULES.ZONES, 'read'),
  asyncHandler(listSubZonesGroupedController),
)
subZoneRouter.put(
  '/update',
  authenticateToken,
  checkPermission(MODULES.ZONES, 'update'),
  asyncHandler(updateSubZoneController),
)
subZoneRouter.delete(
  '/delete',
  authenticateToken,
  checkPermission(MODULES.ZONES, 'delete'),
  asyncHandler(deleteSubZoneController),
)

export default subZoneRouter
