import { Router } from 'express'
import { asyncHandler } from '../utils/asyncWrapper.js'
import { authenticateToken } from '../middlewares/jwtAuth.js'
import {
  listDeliveryApprovalQueuePoProductsController,
  getDeliveryApprovalPoProductByIdController,
  approveDeliveryByHodController,
} from '../controller/deliveryApprovalBucket/deliveryApprovalBucket.controller.js'

const deliveryApprovalBucketRouter = Router()

deliveryApprovalBucketRouter.get(
  '/po-products',
  authenticateToken,
  asyncHandler(listDeliveryApprovalQueuePoProductsController)
)
deliveryApprovalBucketRouter.get(
  '/po-products/:id',
  authenticateToken,
  asyncHandler(getDeliveryApprovalPoProductByIdController)
)
deliveryApprovalBucketRouter.post(
  '/po-products/:id/approve-delivery',
  authenticateToken,
  asyncHandler(approveDeliveryByHodController)
)

export default deliveryApprovalBucketRouter
