import { Router } from 'express'
import { asyncHandler } from '../utils/asyncWrapper.js'
import { authenticateToken } from '../middlewares/jwtAuth.js'
import {
  createBillingRequestController,
  listBillingRequestsController,
  getBillingRequestByIdController,
  financeApproveBillingRequestController,
  hodProductActionController,
  resubmitProductController,
  markProductPurchasedController,
} from '../controller/billingRequest/billingRequest.controller.js'

const billingRequestRouter = Router()

billingRequestRouter.get(
  '/',
  authenticateToken,
  asyncHandler(listBillingRequestsController)
)

billingRequestRouter.get(
  '/:id',
  authenticateToken,
  asyncHandler(getBillingRequestByIdController)
)

billingRequestRouter.post(
  '/',
  authenticateToken,
  asyncHandler(createBillingRequestController)
)

billingRequestRouter.patch(
  '/:id/finance-approve',
  authenticateToken,
  asyncHandler(financeApproveBillingRequestController)
)

billingRequestRouter.patch(
  '/:id/products/:productId/hod-action',
  authenticateToken,
  asyncHandler(hodProductActionController)
)

billingRequestRouter.patch(
  '/:id/products/:productId/resubmit',
  authenticateToken,
  asyncHandler(resubmitProductController)
)

billingRequestRouter.patch(
  '/:id/products/:productId/mark-purchased',
  authenticateToken,
  asyncHandler(markProductPurchasedController)
)

export default billingRequestRouter
