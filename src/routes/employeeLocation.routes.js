import { Router } from 'express'
import { asyncHandler } from '../utils/asyncWrapper.js'
import { authenticateToken } from '../middlewares/jwtAuth.js'
import {
  createEmployeeLocationController,
  listEmployeeLocationsController,
} from '../controller/employeeLocation/employeeLocation.controller.js'

const employeeLocationRouter = Router()

employeeLocationRouter.post('/create', authenticateToken, asyncHandler(createEmployeeLocationController))
employeeLocationRouter.get('/list', authenticateToken, asyncHandler(listEmployeeLocationsController))

export default employeeLocationRouter
