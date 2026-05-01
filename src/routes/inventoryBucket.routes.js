import { Router } from 'express'
import { asyncHandler } from '../utils/asyncWrapper.js'
import { authenticateToken } from '../middlewares/jwtAuth.js'
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
  asyncHandler(listInventoryBucketPoProductsController)
)
inventoryBucketRouter.get(
  '/po-products/:id',
  authenticateToken,
  asyncHandler(getInventoryBucketPoProductByIdController)
)
inventoryBucketRouter.post(
  '/po-products/:id/inventory-received',
  authenticateToken,
  asyncHandler(markInventoryReceivedController)
)
inventoryBucketRouter.post(
  '/po-products/:id/ready-for-dispatchment',
  authenticateToken,
  asyncHandler(markReadyForDispatchmentController)
)

export default inventoryBucketRouter
