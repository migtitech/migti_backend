import { Router } from 'express'
import { asyncHandler } from '../utils/asyncWrapper.js'
import { authenticateToken, checkPermission } from '../middlewares/jwtAuth.js'
import { MODULES } from '../core/common/constant.js'
import {
  listPurchaseBucketPoProductsController,
  getPurchaseBucketPoProductByIdController,
  raisePurchaseBucketPaymentRequestController,
  markPurchaseBucketLinePurchasedController,
} from '../controller/purchaseBucket/purchaseBucket.controller.js'

const purchaseBucketRouter = Router()

purchaseBucketRouter.get(
  '/po-products',
  authenticateToken,
  checkPermission(MODULES.PRO_BUCKET, 'read'),
  asyncHandler(listPurchaseBucketPoProductsController)
)
purchaseBucketRouter.get(
  '/po-products/:id',
  authenticateToken,
  checkPermission(MODULES.PRO_BUCKET, 'read'),
  asyncHandler(getPurchaseBucketPoProductByIdController)
)
purchaseBucketRouter.post(
  '/po-products/:id/payment-request',
  authenticateToken,
  checkPermission(MODULES.PURCHASE_BUCKET, 'update'),
  asyncHandler(raisePurchaseBucketPaymentRequestController)
)
purchaseBucketRouter.post(
  '/po-products/:id/mark-purchased',
  authenticateToken,
  checkPermission(MODULES.PURCHASE_BUCKET, 'update'),
  asyncHandler(markPurchaseBucketLinePurchasedController)
)

export default purchaseBucketRouter
