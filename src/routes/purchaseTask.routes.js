import { Router } from 'express'
import { asyncHandler } from '../utils/asyncWrapper.js'
import { authenticateToken, checkPermission } from '../middlewares/jwtAuth.js'
import { MODULES } from '../core/common/constant.js'
import {
  assignPurchaseTaskController,
  listMyPurchaseTasksController,
  updatePurchaseTaskStatusController,
  updatePurchaseTaskRemarkController,
  listRateBucketController,
  adminListPurchaseTasksController,
} from '../controller/purchaseTask/purchaseTask.controller.js'

const purchaseTaskRouter = Router()

// Assign quotation as a purchase task (uses quotation update permission)
purchaseTaskRouter.post(
  '/assign',
  authenticateToken,
  checkPermission(MODULES.QUOTATIONS, 'update'),
  asyncHandler(assignPurchaseTaskController),
)

// My tasks (role-based filter: purchase_exicutive, purchase_manager, etc.)
purchaseTaskRouter.get(
  '/my-tasks',
  authenticateToken,
  checkPermission(MODULES.PURCHASE_TASKS, 'read'),
  asyncHandler(listMyPurchaseTasksController),
)

// Update task status
purchaseTaskRouter.put(
  '/update-status',
  authenticateToken,
  checkPermission(MODULES.PURCHASE_TASKS, 'update'),
  asyncHandler(updatePurchaseTaskStatusController),
)

// Update supplier rate remark
purchaseTaskRouter.put(
  '/update-remark',
  authenticateToken,
  checkPermission(MODULES.PURCHASE_TASKS, 'update'),
  asyncHandler(updatePurchaseTaskRemarkController),
)

// Rate bucket data (task-based rate view)
purchaseTaskRouter.get(
  '/rate-bucket',
  authenticateToken,
  checkPermission(MODULES.PURCHASE_TASKS, 'read'),
  asyncHandler(listRateBucketController),
)

// Admin tracking view (full visibility with filters)
purchaseTaskRouter.get(
  '/admin-list',
  authenticateToken,
  checkPermission(MODULES.PURCHASE_TASKS, 'read'),
  asyncHandler(adminListPurchaseTasksController),
)

export default purchaseTaskRouter

