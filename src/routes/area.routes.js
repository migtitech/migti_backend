import { Router } from 'express'
import { asyncHandler } from '../utils/asyncWrapper.js'
import {
  createAreaController,
  listAreasController,
  getAreaByIdController,
  updateAreaController,
  deleteAreaController,
} from '../controller/area/area.controller.js'

const areaRouter = Router()

areaRouter.post('/create', asyncHandler(createAreaController))
areaRouter.get('/list', asyncHandler(listAreasController))
areaRouter.get('/get-by-id', asyncHandler(getAreaByIdController))
areaRouter.put('/update', asyncHandler(updateAreaController))
areaRouter.delete('/delete', asyncHandler(deleteAreaController))

export default areaRouter
