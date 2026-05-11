import { Router } from 'express'
import { asyncHandler } from '../utils/asyncWrapper.js'
import { authenticateToken, checkPermission } from '../middlewares/jwtAuth.js'
import { MODULES } from '../core/common/constant.js'
import {
  createQueryController,
  listQueriesController,
  listQueriesByIndustryController,
  getQueryByIdController,
  getQueryLineProcurementRatesController,
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
  getZoneTargetAnalyticsController,
  upsertZoneTargetAnalyticsController,
  getZoneTargetSummaryController,
  getEmployeeTargetAnalyticsController,
  upsertEmployeeTargetAnalyticsController,
  getEmployeeTargetSummaryController,
  getSalesDashboardCardsController,
  getRecentSalesBillingsController,
  getHodDashboardCardsController,
} from '../controller/query/query.controller.js'

const queryRouter = Router()

queryRouter.post(
  '/create',
  authenticateToken,
  checkPermission(MODULES.QUERIES, 'create'),
  asyncHandler(createQueryController)
)
queryRouter.get(
  '/list',
  authenticateToken,
  checkPermission(MODULES.QUERIES, 'read'),
  asyncHandler(listQueriesController)
)
queryRouter.get(
  '/by-industry',
  authenticateToken,
  checkPermission(MODULES.QUERIES, 'read'),
  asyncHandler(listQueriesByIndustryController)
)
queryRouter.get(
  '/today-stats',
  authenticateToken,
  checkPermission(MODULES.QUERIES, 'read'),
  asyncHandler(getTodayDashboardStatsController)
)
queryRouter.get(
  '/sales-dashboard-cards',
  authenticateToken,
  checkPermission(MODULES.QUERIES, 'read'),
  asyncHandler(getSalesDashboardCardsController)
)
queryRouter.get(
  '/sales-recent-billings',
  authenticateToken,
  checkPermission(MODULES.QUERIES, 'read'),
  asyncHandler(getRecentSalesBillingsController)
)
queryRouter.get(
  '/hod-dashboard-cards',
  authenticateToken,
  checkPermission(MODULES.TARGET_ANALYTICS, 'read'),
  asyncHandler(getHodDashboardCardsController)
)
queryRouter.get(
  '/branch-analytics',
  authenticateToken,
  checkPermission(MODULES.BRANCH_ANALYTICS, 'read'),
  asyncHandler(getBranchAnalyticsController)
)
queryRouter.get(
  '/target-analytics',
  authenticateToken,
  checkPermission(MODULES.TARGET_ANALYTICS, 'read'),
  asyncHandler(getTargetAnalyticsController)
)
queryRouter.get(
  '/target-analytics/summary',
  authenticateToken,
  checkPermission(MODULES.TARGET_ANALYTICS, 'read'),
  asyncHandler(getTargetSummaryController)
)
queryRouter.post(
  '/target-analytics',
  authenticateToken,
  checkPermission(MODULES.TARGET_ANALYTICS, 'update'),
  asyncHandler(upsertTargetAnalyticsController)
)
queryRouter.post(
  '/target-analytics/archive',
  authenticateToken,
  checkPermission(MODULES.TARGET_ANALYTICS, 'update'),
  asyncHandler(runTargetAnalyticsArchiveController)
)
queryRouter.get(
  '/target-analytics/zone',
  authenticateToken,
  checkPermission(MODULES.TARGET_ANALYTICS, 'read'),
  asyncHandler(getZoneTargetAnalyticsController)
)
queryRouter.get(
  '/target-analytics/zone/summary',
  authenticateToken,
  checkPermission(MODULES.TARGET_ANALYTICS, 'read'),
  asyncHandler(getZoneTargetSummaryController)
)
queryRouter.post(
  '/target-analytics/zone',
  authenticateToken,
  checkPermission(MODULES.TARGET_ANALYTICS, 'update'),
  asyncHandler(upsertZoneTargetAnalyticsController)
)
queryRouter.get(
  '/target-analytics/employee',
  authenticateToken,
  checkPermission(MODULES.TARGET_ANALYTICS, 'read'),
  asyncHandler(getEmployeeTargetAnalyticsController)
)
queryRouter.get(
  '/target-analytics/employee/summary',
  authenticateToken,
  checkPermission(MODULES.TARGET_ANALYTICS, 'read'),
  asyncHandler(getEmployeeTargetSummaryController)
)
queryRouter.post(
  '/target-analytics/employee',
  authenticateToken,
  checkPermission(MODULES.TARGET_ANALYTICS, 'update'),
  asyncHandler(upsertEmployeeTargetAnalyticsController)
)
queryRouter.get(
  '/get-by-id',
  authenticateToken,
  checkPermission(MODULES.QUERIES, 'read'),
  asyncHandler(getQueryByIdController)
)
queryRouter.get(
  '/query-line-procurement-rates',
  authenticateToken,
  checkPermission(MODULES.QUERIES, 'read'),
  asyncHandler(getQueryLineProcurementRatesController)
)
queryRouter.get(
  '/export-pdf',
  authenticateToken,
  checkPermission(MODULES.QUERIES, 'read'),
  asyncHandler(exportQueryPdfController)
)
queryRouter.put(
  '/update',
  authenticateToken,
  checkPermission(MODULES.QUERIES, 'update'),
  asyncHandler(updateQueryController)
)
queryRouter.delete(
  '/delete',
  authenticateToken,
  checkPermission(MODULES.QUERIES, 'delete'),
  asyncHandler(deleteQueryController)
)
queryRouter.get(
  '/activities',
  authenticateToken,
  checkPermission(MODULES.QUERIES, 'read'),
  asyncHandler(listQueryActivitiesController)
)
queryRouter.post(
  '/record-activity',
  authenticateToken,
  checkPermission(MODULES.QUERIES, 'create'),
  asyncHandler(recordQueryActivityController)
)
queryRouter.post(
  '/convert-to-quotation',
  authenticateToken,
  checkPermission(MODULES.QUERIES, 'update'),
  asyncHandler(convertQueryToQuotationController)
)
queryRouter.post(
  '/link-converted-quotation',
  authenticateToken,
  checkPermission(MODULES.QUERIES, 'update'),
  asyncHandler(linkConvertedQuotationController)
)

export default queryRouter
