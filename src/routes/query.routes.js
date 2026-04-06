import { Router } from 'express'
import { asyncHandler } from '../utils/asyncWrapper.js'
import { authenticateToken, checkPermission } from '../middlewares/jwtAuth.js'
import { MODULES } from '../core/common/constant.js'
import {
  createQueryController,
  listQueriesController,
  getQueryByIdController,
  updateQueryController,
  deleteQueryController,
  listQueryActivitiesController,
  recordQueryActivityController,
  convertQueryToQuotationController,
  linkConvertedQuotationController,
  exportQueryPdfController,
  getTodayDashboardStatsController,
  getBranchAnalyticsController,
  getTargetAnalyticsController,
  upsertTargetAnalyticsController,
  runTargetAnalyticsArchiveController,
  getTargetSummaryController,
} from '../controller/query/query.controller.js'

const queryRouter = Router()

queryRouter.post('/create', authenticateToken, checkPermission(MODULES.QUERIES, 'create'), asyncHandler(createQueryController))
queryRouter.get('/list', authenticateToken, checkPermission(MODULES.QUERIES, 'read'), asyncHandler(listQueriesController))
queryRouter.get('/today-stats', authenticateToken, checkPermission(MODULES.QUERIES, 'read'), asyncHandler(getTodayDashboardStatsController))
queryRouter.get('/branch-analytics', authenticateToken, checkPermission(MODULES.QUERIES, 'read'), asyncHandler(getBranchAnalyticsController))
queryRouter.get('/target-analytics', authenticateToken, checkPermission(MODULES.QUERIES, 'read'), asyncHandler(getTargetAnalyticsController))
queryRouter.get('/target-analytics/summary', authenticateToken, checkPermission(MODULES.QUERIES, 'read'), asyncHandler(getTargetSummaryController))
queryRouter.post('/target-analytics', authenticateToken, checkPermission(MODULES.QUERIES, 'update'), asyncHandler(upsertTargetAnalyticsController))
queryRouter.post('/target-analytics/archive', authenticateToken, checkPermission(MODULES.QUERIES, 'update'), asyncHandler(runTargetAnalyticsArchiveController))
queryRouter.get('/get-by-id', authenticateToken, checkPermission(MODULES.QUERIES, 'read'), asyncHandler(getQueryByIdController))
queryRouter.get('/export-pdf', authenticateToken, checkPermission(MODULES.QUERIES, 'read'), asyncHandler(exportQueryPdfController))
queryRouter.put('/update', authenticateToken, checkPermission(MODULES.QUERIES, 'update'), asyncHandler(updateQueryController))
queryRouter.delete('/delete', authenticateToken, checkPermission(MODULES.QUERIES, 'delete'), asyncHandler(deleteQueryController))
queryRouter.get('/activities', authenticateToken, checkPermission(MODULES.QUERIES, 'read'), asyncHandler(listQueryActivitiesController))
queryRouter.post('/record-activity', authenticateToken, checkPermission(MODULES.QUERIES, 'create'), asyncHandler(recordQueryActivityController))
queryRouter.post(
  '/convert-to-quotation',
  authenticateToken,
  checkPermission(MODULES.QUERIES, 'update'),
  asyncHandler(convertQueryToQuotationController),
)
queryRouter.post(
  '/link-converted-quotation',
  authenticateToken,
  checkPermission(MODULES.QUERIES, 'update'),
  asyncHandler(linkConvertedQuotationController),
)

export default queryRouter
