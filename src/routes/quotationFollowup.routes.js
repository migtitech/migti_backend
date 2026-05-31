import { Router } from 'express'
import { asyncHandler } from '../utils/asyncWrapper.js'
import { authenticateToken, checkPermission } from '../middlewares/jwtAuth.js'
import { MODULES } from '../core/common/constant.js'
import {
  listQuotationFollowupController,
  updateQuotationFollowupRemarkController,
} from '../controller/quotationFollowup/quotationFollowup.controller.js'

const quotationFollowupRouter = Router()

quotationFollowupRouter.get(
  '/list',
  authenticateToken,
  checkPermission(MODULES.QUOTATIONS, 'read'),
  asyncHandler(listQuotationFollowupController)
)

quotationFollowupRouter.put(
  '/update-remark',
  authenticateToken,
  checkPermission(MODULES.QUOTATIONS, 'update'),
  asyncHandler(updateQuotationFollowupRemarkController)
)

export default quotationFollowupRouter
