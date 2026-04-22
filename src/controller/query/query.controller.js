import { Message, statusCodes, BRANCH_BYPASS_ROLES, FULL_ACCESS_ROLES } from '../../core/common/constant.js'
import { getBranchFilter, getBranchIdForCreate } from '../../core/helpers/branchFilter.js'
import {
  createQuerySchema,
  listQuerySchema,
  listQueriesByIndustrySchema,
  getQueryByIdSchema,
  updateQuerySchema,
  deleteQuerySchema,
  listQueryActivitiesSchema,
  recordQueryActivitySchema,
  linkConvertedQuotationSchema,
  convertQueryToQuotationSchema,
  branchAnalyticsSchema,
  targetAnalyticsSchema,
  listTargetAnalyticsSchema,
  targetSummarySchema,
  zoneTargetAnalyticsSchema,
  zoneTargetSummarySchema,
  listZoneTargetAnalyticsSchema,
  employeeTargetAnalyticsSchema,
  employeeTargetSummarySchema,
  listEmployeeTargetAnalyticsSchema,
} from '../../validator/query/query.validator.js'
import {
  addQuery,
  listQueries,
  getQueryById,
  updateQuery,
  deleteQuery,
  listQueryActivities,
  recordQueryActivity,
  getTodayDashboardStats,
  convertQueryToQuotation,
  linkConvertedQuotationToQuery,
  getBranchAnalytics,
  getTargetAnalytics,
  upsertTargetAnalytics,
  getTargetSummary,
  getZoneTargetAnalytics,
  upsertZoneTargetAnalytics,
  getZoneTargetSummary,
  getEmployeeTargetAnalytics,
  upsertEmployeeTargetAnalytics,
  getEmployeeTargetSummary,
  getSalesDashboardCards,
  getRecentSalesBillings,
  getHodDashboardCards,
} from '../../services/query/query.service.js'
import { archiveExpiredTargets } from '../../services/targetAnalytics/targetAnalytics.service.js'
import { exportQueryPdf } from '../../services/query/queryPdfExport.service.js'

const normalizeRole = (role) => String(role || '').trim().toLowerCase().replace(/[\s-]+/g, '_')

const roleHasFullAccess = (role) => {
  const n = normalizeRole(role)
  return FULL_ACCESS_ROLES.some((r) => normalizeRole(r) === n)
}

const isLikelyObjectId = (s) => /^[a-fA-F0-9]{24}$/.test(String(s || ''))

/** Token employee id, or ?employeeId= for admin / HOD / super_admin (QUERIES read still required). */
const resolveSalesDashboardEmployeeId = (req) => {
  const tokenId = req.user?.id || req.user?._id
  const q = req.query?.employeeId
  if (q && roleHasFullAccess(req.user?.role) && isLikelyObjectId(q)) {
    return String(q)
  }
  return tokenId != null ? String(tokenId) : ''
}
const isBackOfficeRole = (role) => {
  const normalized = normalizeRole(role)
  if (['back_office_exicutive', 'back_office_executive', 'boe'].includes(normalized)) return true
  return normalized.replace(/_/g, '').includes('backoffice')
}
const hasOwnershipBypass = (role) => {
  const normalized = normalizeRole(role)
  if (BRANCH_BYPASS_ROLES.includes(normalized)) return true
  return isBackOfficeRole(normalized)
}
const resolveQueryBranchFilter = (req, options = {}) => {
  // Back office can view/manage query/quotation data across all employees.
  if (isBackOfficeRole(req?.user?.role)) return {}
  return getBranchFilter(req, options)
}

export const createQueryController = async (req, res) => {
  const { error, value } = createQuerySchema.validate(req.body, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const branchId = getBranchIdForCreate(req)
  const created_by = req.user?.id || req.user?._id || value.created_by
  const result = await addQuery({ ...value, created_by, branchId })
  return res.status(statusCodes.created).json({
    success: true,
    message: 'Query created successfully',
    data: result,
  })
}

export const listQueriesController = async (req, res) => {
  const { error, value } = listQuerySchema.validate(req.query, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const branchFilter = resolveQueryBranchFilter(req, { allowQueryBranchId: true })
  const currentUserId = req.user?.id || req.user?._id
  const isFullAccessRole = hasOwnershipBypass(req.user?.role)
  const result = await listQueries({
    ...value,
    branchFilter,
    currentUserId: currentUserId || null,
    isFullAccessRole: !!isFullAccessRole,
    role: req.user?.role || '',
  })
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Queries retrieved successfully',
    data: result,
  })
}

export const listQueriesByIndustryController = async (req, res) => {
  const { error, value } = listQueriesByIndustrySchema.validate(req.query, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const branchFilter = resolveQueryBranchFilter(req, { allowQueryBranchId: true })
  const currentUserId = req.user?.id || req.user?._id
  const isFullAccessRole = hasOwnershipBypass(req.user?.role)
  const result = await listQueries({
    ...value,
    branchFilter,
    currentUserId: currentUserId || null,
    isFullAccessRole: !!isFullAccessRole,
    role: req.user?.role || '',
  })
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Queries by industry retrieved successfully',
    data: result,
  })
}

export const getQueryByIdController = async (req, res) => {
  const { error, value } = getQueryByIdSchema.validate(req.query, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const branchFilter = resolveQueryBranchFilter(req)
  const currentUserId = req.user?.id || req.user?._id
  const isFullAccessRole = hasOwnershipBypass(req.user?.role)
  const result = await getQueryById({
    ...value,
    branchFilter,
    currentUserId: currentUserId || null,
    isFullAccessRole: !!isFullAccessRole,
    role: req.user?.role || '',
  })
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Query details retrieved successfully',
    data: result,
  })
}

export const updateQueryController = async (req, res) => {
  const { error, value } = updateQuerySchema.validate(
    { ...req.body, ...req.query },
    { abortEarly: false },
  )
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const branchFilter = resolveQueryBranchFilter(req)
  const currentUserId = req.user?.id || req.user?._id
  const isFullAccessRole = hasOwnershipBypass(req.user?.role)
  const result = await updateQuery({
    ...value,
    branchFilter,
    currentUserId: currentUserId || null,
    isFullAccessRole: !!isFullAccessRole,
    role: req.user?.role || '',
  })
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Query updated successfully',
    data: result,
  })
}

export const deleteQueryController = async (req, res) => {
  const { error, value } = deleteQuerySchema.validate(req.query, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const branchFilter = resolveQueryBranchFilter(req)
  const currentUserId = req.user?.id || req.user?._id
  const isFullAccessRole = hasOwnershipBypass(req.user?.role)
  const result = await deleteQuery({
    ...value,
    branchFilter,
    currentUserId: currentUserId || null,
    isFullAccessRole: !!isFullAccessRole,
    role: req.user?.role || '',
  })
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Query deleted successfully',
    data: result,
  })
}

export const listQueryActivitiesController = async (req, res) => {
  const { error, value } = listQueryActivitiesSchema.validate(req.query, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const branchFilter = resolveQueryBranchFilter(req)
  const currentUserId = req.user?.id || req.user?._id
  const isFullAccessRole = hasOwnershipBypass(req.user?.role)
  const result = await listQueryActivities({
    ...value,
    branchFilter,
    currentUserId: currentUserId || null,
    isFullAccessRole: !!isFullAccessRole,
    role: req.user?.role || '',
  })
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Query activities retrieved successfully',
    data: result,
  })
}

export const recordQueryActivityController = async (req, res) => {
  const { error, value } = recordQueryActivitySchema.validate(req.body, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const branchFilter = resolveQueryBranchFilter(req)
  const currentUserId = req.user?.id || req.user?._id
  const isFullAccessRole = hasOwnershipBypass(req.user?.role)
  const result = await recordQueryActivity({
    ...value,
    branchFilter,
    currentUserId: currentUserId || null,
    isFullAccessRole: !!isFullAccessRole,
    role: req.user?.role || '',
  })
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Activity recorded successfully',
    data: result,
  })
}

export const linkConvertedQuotationController = async (req, res) => {
  const { error, value } = linkConvertedQuotationSchema.validate(req.body, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const branchFilter = resolveQueryBranchFilter(req)
  const currentUserId = req.user?.id || req.user?._id
  const isFullAccessRole = hasOwnershipBypass(req.user?.role)
  const result = await linkConvertedQuotationToQuery({
    queryId: value.queryId,
    quotationId: value.quotationId,
    quotationCode: value.quotationCode,
    branchFilter,
    currentUserId: currentUserId || null,
    isFullAccessRole: !!isFullAccessRole,
    role: req.user?.role || '',
  })
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Quotation linked to query successfully',
    data: result,
  })
}

export const convertQueryToQuotationController = async (req, res) => {
  const payload = { ...req.query, ...req.body }
  const { error, value } = convertQueryToQuotationSchema.validate(payload, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const branchFilter = resolveQueryBranchFilter(req)
  const created_by = req.user?.id || req.user?._id
  const isFullAccessRole = hasOwnershipBypass(req.user?.role)
  const result = await convertQueryToQuotation({
    queryCode: value.queryCode,
    forceNewQuotation: !!value.forceNewQuotation,
    remark: value.remark,
    products: value.products,
    created_by,
    branchFilter,
    isFullAccessRole: !!isFullAccessRole,
    role: req.user?.role || '',
  })
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Query converted to quotation successfully',
    data: result,
  })
}

export const exportQueryPdfController = async (req, res) => {
  const { error, value } = getQueryByIdSchema.validate(req.query, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const branchFilter = resolveQueryBranchFilter(req)
  const currentUserId = req.user?.id || req.user?._id
  const isFullAccessRole = hasOwnershipBypass(req.user?.role)
  const { buffer, queryCode } = await exportQueryPdf({
    ...value,
    branchFilter,
    currentUserId: currentUserId || null,
    isFullAccessRole: !!isFullAccessRole,
    role: req.user?.role || '',
  })
  const fileName = `query-${queryCode || value.queryId}-${new Date().toISOString().slice(0, 10)}.pdf`
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
  res.setHeader('Content-Length', buffer.length)
  res.end(buffer, 'binary')
}

export const getTodayDashboardStatsController = async (req, res) => {
  const branchFilter = resolveQueryBranchFilter(req, { allowQueryBranchId: true })
  const currentUserId = req.user?.id || req.user?._id
  const isFullAccessRole = hasOwnershipBypass(req.user?.role)

  const result = await getTodayDashboardStats({
    branchFilter,
    currentUserId: currentUserId || null,
    isFullAccessRole: !!isFullAccessRole,
    role: req.user?.role || '',
  })

  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Today dashboard stats retrieved successfully',
    data: result,
  })
}

export const getBranchAnalyticsController = async (req, res) => {
  const { error, value } = branchAnalyticsSchema.validate(req.query, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const branchFilter = resolveQueryBranchFilter(req, { allowQueryBranchId: true })
  const currentUserId = req.user?.id || req.user?._id
  const isFullAccessRole = hasOwnershipBypass(req.user?.role)
  const result = await getBranchAnalytics({
    ...value,
    branchFilter,
    currentUserId: currentUserId || null,
    isFullAccessRole: !!isFullAccessRole,
    role: req.user?.role || '',
  })

  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Branch analytics retrieved successfully',
    data: result,
  })
}

export const getTargetAnalyticsController = async (req, res) => {
  const { error, value } = listTargetAnalyticsSchema.validate(req.query, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const branchFilter = resolveQueryBranchFilter(req, { allowQueryBranchId: true })
  const result = await getTargetAnalytics({
    ...value,
    branchFilter,
  })

  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Target analytics retrieved successfully',
    data: result,
  })
}

export const upsertTargetAnalyticsController = async (req, res) => {
  const { error, value } = targetAnalyticsSchema.validate(req.body, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const branchFilter = resolveQueryBranchFilter(req, { allowQueryBranchId: true })
  const userId = req.user?.id || req.user?._id
  const result = await upsertTargetAnalytics({
    ...value,
    userId,
    branchFilter,
  })

  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Target analytics updated successfully',
    data: result,
  })
}

export const runTargetAnalyticsArchiveController = async (req, res) => {
  const result = await archiveExpiredTargets()
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Target analytics archive run completed',
    data: result,
  })
}

export const getTargetSummaryController = async (req, res) => {
  const { error, value } = targetSummarySchema.validate(req.query, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const branchFilter = resolveQueryBranchFilter(req, { allowQueryBranchId: true })
  const result = await getTargetSummary({
    ...value,
    branchFilter,
  })

  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Target summary retrieved successfully',
    data: result,
  })
}

export const getZoneTargetAnalyticsController = async (req, res) => {
  const { error, value } = listZoneTargetAnalyticsSchema.validate(req.query, { abortEarly: false })
  if (error) return res.status(statusCodes.badRequest).json({ success: false, message: Message.validationError, error: error.details.map((d) => d.message) })
  const branchFilter = resolveQueryBranchFilter(req, { allowQueryBranchId: true })
  const result = await getZoneTargetAnalytics({ ...value, branchFilter })
  return res.status(statusCodes.ok).json({ success: true, message: 'Zone target analytics retrieved successfully', data: result })
}

export const upsertZoneTargetAnalyticsController = async (req, res) => {
  const { error, value } = zoneTargetAnalyticsSchema.validate(req.body, { abortEarly: false })
  if (error) return res.status(statusCodes.badRequest).json({ success: false, message: Message.validationError, error: error.details.map((d) => d.message) })
  const branchFilter = resolveQueryBranchFilter(req, { allowQueryBranchId: true })
  const userId = req.user?.id || req.user?._id
  const result = await upsertZoneTargetAnalytics({ ...value, userId, branchFilter })
  return res.status(statusCodes.ok).json({ success: true, message: 'Zone target updated successfully', data: result })
}

export const getZoneTargetSummaryController = async (req, res) => {
  const { error, value } = zoneTargetSummarySchema.validate(req.query, { abortEarly: false })
  if (error) return res.status(statusCodes.badRequest).json({ success: false, message: Message.validationError, error: error.details.map((d) => d.message) })
  const branchFilter = resolveQueryBranchFilter(req, { allowQueryBranchId: true })
  const result = await getZoneTargetSummary({ ...value, branchFilter })
  return res.status(statusCodes.ok).json({ success: true, message: 'Zone target summary retrieved successfully', data: result })
}

export const getEmployeeTargetAnalyticsController = async (req, res) => {
  const { error, value } = listEmployeeTargetAnalyticsSchema.validate(req.query, { abortEarly: false })
  if (error) return res.status(statusCodes.badRequest).json({ success: false, message: Message.validationError, error: error.details.map((d) => d.message) })
  const branchFilter = resolveQueryBranchFilter(req, { allowQueryBranchId: true })
  const result = await getEmployeeTargetAnalytics({ ...value, branchFilter })
  return res.status(statusCodes.ok).json({ success: true, message: 'Employee target analytics retrieved successfully', data: result })
}

export const upsertEmployeeTargetAnalyticsController = async (req, res) => {
  const { error, value } = employeeTargetAnalyticsSchema.validate(req.body, { abortEarly: false })
  if (error) return res.status(statusCodes.badRequest).json({ success: false, message: Message.validationError, error: error.details.map((d) => d.message) })
  const branchFilter = resolveQueryBranchFilter(req, { allowQueryBranchId: true })
  const userId = req.user?.id || req.user?._id
  const result = await upsertEmployeeTargetAnalytics({ ...value, userId, branchFilter })
  return res.status(statusCodes.ok).json({ success: true, message: 'Employee target updated successfully', data: result })
}

export const getEmployeeTargetSummaryController = async (req, res) => {
  const { error, value } = employeeTargetSummarySchema.validate(req.query, { abortEarly: false })
  if (error) return res.status(statusCodes.badRequest).json({ success: false, message: Message.validationError, error: error.details.map((d) => d.message) })
  const branchFilter = resolveQueryBranchFilter(req, { allowQueryBranchId: true })
  const result = await getEmployeeTargetSummary({ ...value, branchFilter })
  return res.status(statusCodes.ok).json({ success: true, message: 'Employee target summary retrieved successfully', data: result })
}

export const getSalesDashboardCardsController = async (req, res) => {
  const employeeId = resolveSalesDashboardEmployeeId(req)
  const rawBranchId = req.user?.branchId
  const branchId =
    rawBranchId && typeof rawBranchId === 'object' && rawBranchId._id != null
      ? rawBranchId._id
      : rawBranchId || null
  const result = await getSalesDashboardCards({ employeeId, branchId })
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Sales dashboard cards retrieved successfully',
    data: result,
  })
}

export const getRecentSalesBillingsController = async (req, res) => {
  const employeeId = resolveSalesDashboardEmployeeId(req)
  const limit = req.query?.limit
  const result = await getRecentSalesBillings({ employeeId, limit })
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Recent billings retrieved successfully',
    data: result,
  })
}

export const getHodDashboardCardsController = async (req, res) => {
  const raw = req.user?.branchId
  const branchId = raw && typeof raw === 'object' && raw._id != null ? raw._id : raw || null
  const result = await getHodDashboardCards({ branchId })
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'HOD dashboard cards retrieved successfully',
    data: result,
  })
}
