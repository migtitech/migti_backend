import { Router } from 'express'
import { asyncHandler } from '../utils/asyncWrapper.js'
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

queryRouter.post('/create', asyncHandler(createQueryController))
queryRouter.get('/list', asyncHandler(listQueriesController))
queryRouter.get('/get-by-id', asyncHandler(getQueryByIdController))
queryRouter.put('/update', asyncHandler(updateQueryController))
queryRouter.delete('/delete', asyncHandler(deleteQueryController))
queryRouter.get('/activities', asyncHandler(listQueryActivitiesController))
queryRouter.post('/record-activity', asyncHandler(recordQueryActivityController))

export default queryRouter
