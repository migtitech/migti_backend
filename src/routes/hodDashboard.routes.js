import { Router } from 'express'
import { asyncHandler } from '../utils/asyncWrapper.js'
import { authenticateToken, checkPermission } from '../middlewares/jwtAuth.js'
import { MODULES } from '../core/common/constant.js'
import {
  getHodOverviewController,
  getHodPendingItemsController,
} from '../controller/hodDashboard/hodDashboard.controller.js'

const hodDashboardRouter = Router()

hodDashboardRouter.get(
  '/overview',
  authenticateToken,
  checkPermission(MODULES.TARGET_ANALYTICS, 'read'),
  asyncHandler(getHodOverviewController)
)

hodDashboardRouter.get(
  '/pending-items',
  authenticateToken,
  checkPermission(MODULES.TARGET_ANALYTICS, 'read'),
  asyncHandler(getHodPendingItemsController)
)

export default hodDashboardRouter
