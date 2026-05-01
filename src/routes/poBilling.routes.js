import { Router } from 'express'
import { asyncHandler } from '../utils/asyncWrapper.js'
import { authenticateToken, checkPermission } from '../middlewares/jwtAuth.js'
import { MODULES } from '../core/common/constant.js'
import {
  createPoEntryController,
  createBillingEntryController,
  getPoBillingAnalyticsController,
  getPoBillingFormOptionsController,
} from '../controller/poBilling/poBilling.controller.js'

const poBillingRouter = Router()

poBillingRouter.post(
  '/po/create',
  authenticateToken,
  checkPermission(MODULES.PO_PAYMENT, 'create'),
  asyncHandler(createPoEntryController)
)

poBillingRouter.post(
  '/billing/create',
  authenticateToken,
  checkPermission(MODULES.PO_PAYMENT, 'create'),
  asyncHandler(createBillingEntryController)
)

poBillingRouter.get(
  '/form-options',
  authenticateToken,
  checkPermission(MODULES.PO_PAYMENT, 'read'),
  asyncHandler(getPoBillingFormOptionsController)
)

poBillingRouter.get(
  '/analytics',
  authenticateToken,
  checkPermission(MODULES.PO_PAYMENT, 'read'),
  asyncHandler(getPoBillingAnalyticsController)
)

export default poBillingRouter
