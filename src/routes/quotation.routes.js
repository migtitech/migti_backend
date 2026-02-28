import { Router } from 'express'
import { asyncHandler } from '../utils/asyncWrapper.js'
import { authenticateToken, checkPermission } from '../middlewares/jwtAuth.js'
import { MODULES } from '../core/common/constant.js'
import {
  listQuotationsController,
  getQuotationByIdController,
  updateQuotationController,
  updateQuotationStatusController,
} from '../controller/quotation/quotation.controller.js'

const quotationRouter = Router()

quotationRouter.get(
  '/list',
  authenticateToken,
  checkPermission(MODULES.QUOTATIONS, 'read'),
  asyncHandler(listQuotationsController),
)
quotationRouter.get(
  '/get-by-id',
  authenticateToken,
  checkPermission(MODULES.QUOTATIONS, 'read'),
  asyncHandler(getQuotationByIdController),
)
quotationRouter.put(
  '/update',
  authenticateToken,
  checkPermission(MODULES.QUOTATIONS, 'update'),
  asyncHandler(updateQuotationController),
)
quotationRouter.put(
  '/update-status',
  authenticateToken,
  checkPermission(MODULES.QUOTATIONS, 'update'),
  asyncHandler(updateQuotationStatusController),
)

export default quotationRouter
