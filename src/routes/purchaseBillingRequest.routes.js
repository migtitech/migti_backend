import { Router } from 'express'
import { asyncHandler } from '../utils/asyncWrapper.js'
import { authenticateToken, checkPermission } from '../middlewares/jwtAuth.js'
import { MODULES } from '../core/common/constant.js'
import {
  listPurchaseBillingRequestsController,
  getPurchaseBillingRequestByIdController,
  updatePurchaseBillingRequestRemarkController,
  approvePurchaseBillingRequestController,
} from '../controller/purchaseBillingRequest/purchaseBillingRequest.controller.js'

const purchaseBillingRequestRouter = Router()

purchaseBillingRequestRouter.get(
  '/list',
  authenticateToken,
  checkPermission(MODULES.BILLING_REQUEST, 'read'),
  asyncHandler(listPurchaseBillingRequestsController)
)
purchaseBillingRequestRouter.get(
  '/:id',
  authenticateToken,
  checkPermission(MODULES.BILLING_REQUEST, 'read'),
  asyncHandler(getPurchaseBillingRequestByIdController)
)
purchaseBillingRequestRouter.put(
  '/:id/remark',
  authenticateToken,
  checkPermission(MODULES.BILLING_REQUEST, 'update'),
  asyncHandler(updatePurchaseBillingRequestRemarkController)
)
purchaseBillingRequestRouter.put(
  '/:id/approve',
  authenticateToken,
  checkPermission(MODULES.BILLING_REQUEST, 'update'),
  asyncHandler(approvePurchaseBillingRequestController)
)

export default purchaseBillingRequestRouter
