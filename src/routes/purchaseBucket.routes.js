import { Router } from 'express'
import { asyncHandler } from '../utils/asyncWrapper.js'
import { authenticateToken } from '../middlewares/jwtAuth.js'
import {
  listPurchaseBucketPoProductsController,
  getPurchaseBucketPoProductByIdController,
  raisePurchaseBucketPaymentRequestController,
  updatePoProductLineAttachmentController,
  markPurchaseBucketLinePurchasedController,
  getPurchaseBillingRequestStatusCountsController,
} from '../controller/purchaseBucket/purchaseBucket.controller.js'

const purchaseBucketRouter = Router()

purchaseBucketRouter.get(
  '/billing-requests/status-counts',
  authenticateToken,
  asyncHandler(getPurchaseBillingRequestStatusCountsController)
)
purchaseBucketRouter.get(
  '/po-products',
  authenticateToken,
  asyncHandler(listPurchaseBucketPoProductsController)
)
purchaseBucketRouter.get(
  '/po-products/:id',
  authenticateToken,
  asyncHandler(getPurchaseBucketPoProductByIdController)
)
purchaseBucketRouter.post(
  '/po-products/:id/payment-request',
  authenticateToken,
  asyncHandler(raisePurchaseBucketPaymentRequestController)
)
purchaseBucketRouter.patch(
  '/po-products/:id/attachment',
  authenticateToken,
  asyncHandler(updatePoProductLineAttachmentController)
)
purchaseBucketRouter.post(
  '/po-products/:id/mark-purchased',
  authenticateToken,
  asyncHandler(markPurchaseBucketLinePurchasedController)
)

export default purchaseBucketRouter
