import { Router } from 'express'
import { asyncHandler } from '../utils/asyncWrapper.js'
import { authenticateToken, checkPermission } from '../middlewares/jwtAuth.js'
import { MODULES } from '../core/common/constant.js'
import {
  completeVisitWithRemarkController,
  createVisitController,
  listVisitsController,
  myVisitsController,
} from '../controller/visit/visit.controller.js'

const visitRouter = Router()

visitRouter.post('/create', authenticateToken, checkPermission(MODULES.VISITS, 'create'), asyncHandler(createVisitController))
visitRouter.get('/list', authenticateToken, checkPermission(MODULES.VISITS, 'read'), asyncHandler(listVisitsController))
visitRouter.get('/my-visits', authenticateToken, checkPermission(MODULES.VISITS, 'read'), asyncHandler(myVisitsController))
visitRouter.patch(
  '/complete-with-remark',
  authenticateToken,
  checkPermission(MODULES.VISITS, 'update'),
  asyncHandler(completeVisitWithRemarkController),
)

export default visitRouter
