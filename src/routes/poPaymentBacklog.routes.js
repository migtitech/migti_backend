import { Router } from 'express'
import { asyncHandler } from '../utils/asyncWrapper.js'
import { authenticateToken, checkPermission } from '../middlewares/jwtAuth.js'
import { MODULES } from '../core/common/constant.js'
import {
  listPoPaymentBacklogController,
  settlePoPaymentBacklogController,
} from '../controller/poPaymentBacklog/poPaymentBacklog.controller.js'

const poPaymentBacklogRouter = Router()

poPaymentBacklogRouter.get(
  '/list',
  authenticateToken,
  checkPermission(MODULES.PO_PAYMENT_BACKLOG, 'read'),
  asyncHandler(listPoPaymentBacklogController)
)

poPaymentBacklogRouter.put(
  '/settle',
  authenticateToken,
  checkPermission(MODULES.PO_PAYMENT_BACKLOG, 'update'),
  asyncHandler(settlePoPaymentBacklogController)
)

export default poPaymentBacklogRouter
