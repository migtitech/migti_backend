import { Router } from 'express'
import { asyncHandler } from '../utils/asyncWrapper.js'
import { authenticateToken } from '../middlewares/jwtAuth.js'
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
  asyncHandler(listDispatchmentQueuePoProductsController)
)
dispatchmentBucketRouter.get(
  '/po-products/:id',
  authenticateToken,
  asyncHandler(getDispatchmentQueuePoProductByIdController)
)
dispatchmentBucketRouter.post(
  '/po-products/:id/ready-for-dispatchment',
  authenticateToken,
  asyncHandler(markReadyForDispatchmentFromQueueController)
)
dispatchmentBucketRouter.post(
  '/po-products/:id/mark-delivered',
  authenticateToken,
  asyncHandler(markPoProductDeliveredController)
)

export default dispatchmentBucketRouter
