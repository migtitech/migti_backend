import { Router } from 'express'
import { asyncHandler } from '../utils/asyncWrapper.js'
import { authenticateToken, checkPermission } from '../middlewares/jwtAuth.js'
import { MODULES } from '../core/common/constant.js'
import {
  createQueryController,
  listQueriesController,
  getQueryByIdController,
  updateQueryController,
  deleteQueryController,
  listQueryActivitiesController,
  recordQueryActivityController,
} from '../controller/query/query.controller.js'

const queryRouter = Router()

queryRouter.post('/create', authenticateToken, checkPermission(MODULES.QUERIES, 'create'), asyncHandler(createQueryController))
queryRouter.get('/list', authenticateToken, checkPermission(MODULES.QUERIES, 'read'), asyncHandler(listQueriesController))
queryRouter.get('/get-by-id', authenticateToken, checkPermission(MODULES.QUERIES, 'read'), asyncHandler(getQueryByIdController))
queryRouter.put('/update', authenticateToken, checkPermission(MODULES.QUERIES, 'update'), asyncHandler(updateQueryController))
queryRouter.delete('/delete', authenticateToken, checkPermission(MODULES.QUERIES, 'delete'), asyncHandler(deleteQueryController))
queryRouter.get('/activities', authenticateToken, checkPermission(MODULES.QUERIES, 'read'), asyncHandler(listQueryActivitiesController))
queryRouter.post('/record-activity', authenticateToken, checkPermission(MODULES.QUERIES, 'create'), asyncHandler(recordQueryActivityController))

export default queryRouter
