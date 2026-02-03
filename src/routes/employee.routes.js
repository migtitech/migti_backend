import { Router } from 'express'
import { asyncHandler } from '../utils/asyncWrapper.js'
import {
  createEmployeeController,
  listEmployeesController,
  getEmployeeByIdController,
  updateEmployeeController,
  deleteEmployeeController,
  loginEmployeeController,
} from '../controller/employee/employee.controller.js'

const employeeRouter = Router()

employeeRouter.post('/create', asyncHandler(createEmployeeController))
employeeRouter.post('/login', asyncHandler(loginEmployeeController))
employeeRouter.get('/list', asyncHandler(listEmployeesController))
employeeRouter.get('/get-by-id', asyncHandler(getEmployeeByIdController))
employeeRouter.put('/update', asyncHandler(updateEmployeeController))
employeeRouter.delete('/delete', asyncHandler(deleteEmployeeController))

export default employeeRouter
