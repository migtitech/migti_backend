import { Router } from 'express'
import { asyncHandler } from '../utils/asyncWrapper.js'
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

rawQueryRouter.post('/create', asyncHandler(createRawQueryController))
rawQueryRouter.get('/list', asyncHandler(listRawQueriesController))
rawQueryRouter.get('/get-by-id', asyncHandler(getRawQueryByIdController))
rawQueryRouter.put('/update', asyncHandler(updateRawQueryController))
rawQueryRouter.delete('/delete', asyncHandler(deleteRawQueryController))
rawQueryRouter.get('/activities', asyncHandler(listRawQueryActivitiesController))
rawQueryRouter.post('/record-activity', asyncHandler(recordRawQueryActivityController))

export default rawQueryRouter
