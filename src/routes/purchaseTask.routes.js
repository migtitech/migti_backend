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

purchaseTaskRouter.post(
  '/assign',
  authenticateToken,
  checkPermission(MODULES.QUOTATIONS, 'update'),
  asyncHandler(assignPurchaseTaskController),
)

purchaseTaskRouter.get(
  '/my-tasks',
  authenticateToken,
  checkPermission(MODULES.PURCHASE_TASKS, 'read'),
  asyncHandler(listMyPurchaseTasksController),
)

purchaseTaskRouter.put(
  '/update-status',
  authenticateToken,
  checkPermission(MODULES.PURCHASE_TASKS, 'update'),
  asyncHandler(updatePurchaseTaskStatusController),
)

purchaseTaskRouter.put(
  '/update-remark',
  authenticateToken,
  checkPermission(MODULES.PURCHASE_TASKS, 'update'),
  asyncHandler(updatePurchaseTaskRemarkController),
)

purchaseTaskRouter.get(
  '/rate-bucket',
  authenticateToken,
  checkPermission(MODULES.PURCHASE_TASKS, 'read'),
  asyncHandler(listRateBucketController),
)

purchaseTaskRouter.get(
  '/admin-list',
  authenticateToken,
  checkPermission(MODULES.PURCHASE_TASKS, 'read'),
  asyncHandler(adminListPurchaseTasksController),
)

export default purchaseTaskRouter

