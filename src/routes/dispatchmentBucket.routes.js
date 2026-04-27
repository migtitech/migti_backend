import { Router } from 'express'
import { asyncHandler } from '../utils/asyncWrapper.js'
import { authenticateToken, checkPermission } from '../middlewares/jwtAuth.js'
import { MODULES } from '../core/common/constant.js'
import {
  listDispatchmentQueuePoProductsController,
  getDispatchmentQueuePoProductByIdController,
  markReadyForDispatchmentFromQueueController,
  markPoProductDeliveredController,
} from '../controller/dispatchmentBucket/dispatchmentBucket.controller.js'

const dispatchmentBucketRouter = Router()

dispatchmentBucketRouter.get(
  '/po-products',
  authenticateToken,
  checkPermission(MODULES.PURCHASE_ORDERS, 'read'),
  asyncHandler(listDispatchmentQueuePoProductsController)
)
dispatchmentBucketRouter.get(
  '/po-products/:id',
  authenticateToken,
  checkPermission(MODULES.PURCHASE_ORDERS, 'read'),
  asyncHandler(getDispatchmentQueuePoProductByIdController)
)
dispatchmentBucketRouter.post(
  '/po-products/:id/ready-for-dispatchment',
  authenticateToken,
  checkPermission(MODULES.DISPATCHMENT, 'update'),
  asyncHandler(markReadyForDispatchmentFromQueueController)
)
dispatchmentBucketRouter.post(
  '/po-products/:id/mark-delivered',
  authenticateToken,
  checkPermission(MODULES.DISPATCHMENT, 'update'),
  asyncHandler(markPoProductDeliveredController)
)

export default dispatchmentBucketRouter
