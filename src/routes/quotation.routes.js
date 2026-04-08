import { Router } from 'express'
import { asyncHandler } from '../utils/asyncWrapper.js'
import { authenticateToken, checkPermission, authorizeRoles } from '../middlewares/jwtAuth.js'
import { MODULES } from '../core/common/constant.js'
import {
  listQuotationsController,
  listQuotationsByIndustryController,
  getQuotationByIdController,
  updateQuotationController,
  updateQuotationStatusController,
  exportQuotationPdfController,
  listRateLogsController,
  deleteQuotationController,
} from '../controller/quotation/quotation.controller.js'

const quotationRouter = Router()

quotationRouter.get(
  '/list',
  authenticateToken,
  checkPermission(MODULES.QUOTATIONS, 'read'),
  asyncHandler(listQuotationsController),
)
quotationRouter.get(
  '/by-industry',
  authenticateToken,
  checkPermission(MODULES.QUOTATIONS, 'read'),
  asyncHandler(listQuotationsByIndustryController),
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
quotationRouter.get(
  '/export-pdf',
  authenticateToken,
  checkPermission(MODULES.QUOTATIONS, 'read'),
  asyncHandler(exportQuotationPdfController),
)
quotationRouter.get(
  '/rate-logs/list',
  authenticateToken,
  checkPermission(MODULES.QUOTATIONS, 'read'),
  asyncHandler(listRateLogsController),
)
quotationRouter.delete(
  '/delete',
  authenticateToken,
  authorizeRoles(['admin']),
  asyncHandler(deleteQuotationController),
)

export default quotationRouter
