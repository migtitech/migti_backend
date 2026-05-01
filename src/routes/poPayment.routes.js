import { Router } from 'express'
import { asyncHandler } from '../utils/asyncWrapper.js'
import { authenticateToken, checkPermission } from '../middlewares/jwtAuth.js'
import { MODULES } from '../core/common/constant.js'
import { appendPoPaymentLedgerController } from '../controller/poPayment/poPayment.controller.js'

const poPaymentRouter = Router()

poPaymentRouter.post(
  '/append-ledger',
  authenticateToken,
  checkPermission(MODULES.PO_PAYMENT, 'update'),
  asyncHandler(appendPoPaymentLedgerController)
)

export default poPaymentRouter
