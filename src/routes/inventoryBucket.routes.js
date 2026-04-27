import { Router } from 'express'
import { asyncHandler } from '../utils/asyncWrapper.js'
import { authenticateToken, checkPermission } from '../middlewares/jwtAuth.js'
import { MODULES } from '../core/common/constant.js'
import {
  listInventoryBucketPoProductsController,
  getInventoryBucketPoProductByIdController,
  markInventoryReceivedController,
  markReadyForDispatchmentController,
} from '../controller/inventoryBucket/inventoryBucket.controller.js'

const inventoryBucketRouter = Router()

inventoryBucketRouter.get(
  '/po-products',
  authenticateToken,
  checkPermission(MODULES.PURCHASE_ORDERS, 'read'),
  asyncHandler(listInventoryBucketPoProductsController)
)
inventoryBucketRouter.get(
  '/po-products/:id',
  authenticateToken,
  checkPermission(MODULES.PURCHASE_ORDERS, 'read'),
  asyncHandler(getInventoryBucketPoProductByIdController)
)
inventoryBucketRouter.post(
  '/po-products/:id/inventory-received',
  authenticateToken,
  checkPermission(MODULES.INVENTORY_BUCKET, 'update'),
  asyncHandler(markInventoryReceivedController)
)
inventoryBucketRouter.post(
  '/po-products/:id/ready-for-dispatchment',
  authenticateToken,
  checkPermission(MODULES.INVENTORY_BUCKET, 'update'),
  asyncHandler(markReadyForDispatchmentController)
)

export default inventoryBucketRouter
