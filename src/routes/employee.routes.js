import { Router } from 'express'
import { asyncHandler } from '../utils/asyncWrapper.js'
import { authenticateToken, checkPermission } from '../middlewares/jwtAuth.js'
import { MODULES } from '../core/common/constant.js'
import {
  createEmployeeController,
  listEmployeesController,
  getEmployeeByIdController,
  updateEmployeeController,
  deleteEmployeeController,
  loginEmployeeController,
} from '../controller/employee/employee.controller.js'

const employeeRouter = Router()

employeeRouter.post('/create', authenticateToken, checkPermission(MODULES.EMPLOYEES, 'create'), asyncHandler(createEmployeeController))
employeeRouter.post('/login', asyncHandler(loginEmployeeController))
employeeRouter.get('/list', authenticateToken, checkPermission(MODULES.EMPLOYEES, 'read'), asyncHandler(listEmployeesController))
employeeRouter.get('/get-by-id', authenticateToken, checkPermission(MODULES.EMPLOYEES, 'read'), asyncHandler(getEmployeeByIdController))
employeeRouter.put('/update', authenticateToken, checkPermission(MODULES.EMPLOYEES, 'update'), asyncHandler(updateEmployeeController))
employeeRouter.delete('/delete', authenticateToken, checkPermission(MODULES.EMPLOYEES, 'delete'), asyncHandler(deleteEmployeeController))

export default employeeRouter
