import { Router } from 'express'
import { asyncHandler } from '../utils/asyncWrapper.js'
import { authenticateToken } from '../middlewares/jwtAuth.js'
import {
  assignLocalPurchaseController,
  getLocalPurchaseByIdController,
  listLocalPurchaseEmployeesController,
  listLocalPurchasesController,
  submitLocalPurchaseController,
  updateLocalPurchaseAttachmentsController,
} from '../controller/localPurchase/localPurchase.controller.js'

const localPurchaseRouter = Router()

localPurchaseRouter.get(
  '/employees',
  authenticateToken,
  asyncHandler(listLocalPurchaseEmployeesController)
)

localPurchaseRouter.post(
  '/assign',
  authenticateToken,
  asyncHandler(assignLocalPurchaseController)
)

localPurchaseRouter.get(
  '/',
  authenticateToken,
  asyncHandler(listLocalPurchasesController)
)

localPurchaseRouter.put(
  '/:id/submit',
  authenticateToken,
  asyncHandler(submitLocalPurchaseController)
)

localPurchaseRouter.put(
  '/:id/attachments',
  authenticateToken,
  asyncHandler(updateLocalPurchaseAttachmentsController)
)

localPurchaseRouter.get(
  '/:id',
  authenticateToken,
  asyncHandler(getLocalPurchaseByIdController)
)

export default localPurchaseRouter
