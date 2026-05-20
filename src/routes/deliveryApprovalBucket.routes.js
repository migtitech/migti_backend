import { Router } from 'express'
import { asyncHandler } from '../utils/asyncWrapper.js'
import { authenticateToken } from '../middlewares/jwtAuth.js'
import {
  listDeliveryApprovalQueuePoProductsController,
  getDeliveryApprovalPoProductByIdController,
  approveDeliveryByHodController,
  getPoProductBucketByIdController,
  updatePoProductEnrichmentController,
  createPoProductController,
  poCodeSuggestionsController,
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

/* PO code autocomplete suggestions */
deliveryApprovalBucketRouter.get(
  '/po-code-suggestions',
  authenticateToken,
  asyncHandler(poCodeSuggestionsController)
)

/* PO Products bucket — create new line */
deliveryApprovalBucketRouter.post(
  '/po-products-bucket',
  authenticateToken,
  asyncHandler(createPoProductController)
)

/* PO Products bucket — general view + enrichment (no deliverySubStatus restriction) */
deliveryApprovalBucketRouter.get(
  '/po-products-bucket/:id',
  authenticateToken,
  asyncHandler(getPoProductBucketByIdController)
)
deliveryApprovalBucketRouter.put(
  '/po-products-bucket/:id',
  authenticateToken,
  asyncHandler(updatePoProductEnrichmentController)
)

export default deliveryApprovalBucketRouter
