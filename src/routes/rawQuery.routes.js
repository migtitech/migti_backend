import { Router } from 'express'
import { asyncHandler } from '../utils/asyncWrapper.js'
import { authenticateToken, checkPermission } from '../middlewares/jwtAuth.js'
import { MODULES } from '../core/common/constant.js'
import {
  createRawQueryController,
  listRawQueriesController,
  getRawQueryByIdController,
  updateRawQueryController,
  deleteRawQueryController,
  listRawQueryActivitiesController,
  recordRawQueryActivityController,
} from '../controller/rawQuery/rawQuery.controller.js'

const rawQueryRouter = Router()

rawQueryRouter.post('/create', authenticateToken, checkPermission(MODULES.RAW_QUERIES, 'create'), asyncHandler(createRawQueryController))
rawQueryRouter.get('/list', authenticateToken, checkPermission(MODULES.RAW_QUERIES, 'read'), asyncHandler(listRawQueriesController))
rawQueryRouter.get('/get-by-id', authenticateToken, checkPermission(MODULES.RAW_QUERIES, 'read'), asyncHandler(getRawQueryByIdController))
rawQueryRouter.put('/update', authenticateToken, checkPermission(MODULES.RAW_QUERIES, 'update'), asyncHandler(updateRawQueryController))
rawQueryRouter.delete('/delete', authenticateToken, checkPermission(MODULES.RAW_QUERIES, 'delete'), asyncHandler(deleteRawQueryController))
rawQueryRouter.get('/activities', authenticateToken, checkPermission(MODULES.RAW_QUERIES, 'read'), asyncHandler(listRawQueryActivitiesController))
rawQueryRouter.post('/record-activity', authenticateToken, checkPermission(MODULES.RAW_QUERIES, 'create'), asyncHandler(recordRawQueryActivityController))

export default rawQueryRouter
