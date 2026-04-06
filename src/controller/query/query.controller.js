import { Message, statusCodes } from '../../core/common/constant.js'
import { BRANCH_BYPASS_ROLES } from '../../core/common/constant.js'
import { getBranchFilter, getBranchIdForCreate } from '../../core/helpers/branchFilter.js'
import {
  createQuerySchema,
  listQuerySchema,
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
} from '../../services/query/query.service.js'
import { archiveExpiredTargets } from '../../services/targetAnalytics/targetAnalytics.service.js'
import { exportQueryPdf } from '../../services/query/queryPdfExport.service.js'

const normalizeRole = (role) => String(role || '').trim().toLowerCase().replace(/[\s-]+/g, '_')
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
  })
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Queries retrieved successfully',
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
