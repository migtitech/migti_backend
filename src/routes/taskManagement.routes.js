import { Router } from 'express'
import { asyncHandler } from '../utils/asyncWrapper.js'
import { authenticateToken, checkPermission } from '../middlewares/jwtAuth.js'
import { MODULES } from '../core/common/constant.js'
import {
  createTaskController,
  listTasksController,
  listMyTasksController,
  getTaskByIdController,
  assignEmployeeController,
  updateTaskSupplierController,
  updateTaskController,
  deleteTaskController,
} from '../controller/taskManagement/taskManagement.controller.js'

const taskManagementRouter = Router()

taskManagementRouter.post(
  '/create',
  authenticateToken,
  checkPermission(MODULES.TASK_MANAGEMENT, 'create'),
  asyncHandler(createTaskController)
)
taskManagementRouter.get(
  '/list',
  authenticateToken,
  checkPermission(MODULES.TASK_MANAGEMENT, 'read'),
  asyncHandler(listTasksController)
)
taskManagementRouter.get(
  '/my-tasks',
  authenticateToken,
  checkPermission(MODULES.TASK_BUCKET, 'read'),
  asyncHandler(listMyTasksController)
)
taskManagementRouter.get(
  '/get-by-id/:id',
  authenticateToken,
  checkPermission(MODULES.TASK_MANAGEMENT, 'read'),
  asyncHandler(getTaskByIdController)
)
taskManagementRouter.put(
  '/assign-employee',
  authenticateToken,
  checkPermission(MODULES.TASK_MANAGEMENT, 'update'),
  asyncHandler(assignEmployeeController)
)

taskManagementRouter.put(
  '/update-supplier',
  authenticateToken,
  checkPermission(MODULES.TASK_BUCKET, 'update'),
  asyncHandler(updateTaskSupplierController)
)

taskManagementRouter.put(
  '/update',
  authenticateToken,
  checkPermission(MODULES.TASK_MANAGEMENT, 'update'),
  asyncHandler(updateTaskController)
)

taskManagementRouter.delete(
  '/delete',
  authenticateToken,
  checkPermission(MODULES.TASK_MANAGEMENT, 'delete'),
  asyncHandler(deleteTaskController)
)

export default taskManagementRouter
