import { Router } from 'express'
import { asyncHandler } from '../utils/asyncWrapper.js'
import { authenticateToken } from '../middlewares/jwtAuth.js'
import {
  createEmployeeLocationController,
  getLatestEmployeeLocationController,
  listEmployeeLocationsController,
  listTeamLatestLocationsController,
  listEmployeeLocationHistoryBinnedController,
} from '../controller/employeeLocation/employeeLocation.controller.js'

const employeeLocationRouter = Router()

employeeLocationRouter.post(
  '/create',
  authenticateToken,
  asyncHandler(createEmployeeLocationController)
)
employeeLocationRouter.get(
  '/latest',
  authenticateToken,
  asyncHandler(getLatestEmployeeLocationController)
)
employeeLocationRouter.get(
  '/list',
  authenticateToken,
  asyncHandler(listEmployeeLocationsController)
)
employeeLocationRouter.get(
  '/team-latest',
  authenticateToken,
  asyncHandler(listTeamLatestLocationsController)
)
employeeLocationRouter.get(
  '/history-binned',
  authenticateToken,
  asyncHandler(listEmployeeLocationHistoryBinnedController)
)

export default employeeLocationRouter
