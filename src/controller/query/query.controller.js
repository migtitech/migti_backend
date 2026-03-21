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
} from '../../services/query/query.service.js'
import { convertQueryToQuotationSchema } from '../../validator/query/query.validator.js'
import { convertQueryToQuotation } from '../../services/query/query.service.js'
import { exportQueryPdf } from '../../services/query/queryPdfExport.service.js'

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

  const branchFilter = getBranchFilter(req, { allowQueryBranchId: true })
  const currentUserId = req.user?.id || req.user?._id
  const isFullAccessRole = req.user?.role && BRANCH_BYPASS_ROLES.includes(req.user.role)
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

  const branchFilter = getBranchFilter(req)
  const currentUserId = req.user?.id || req.user?._id
  const isFullAccessRole = req.user?.role && BRANCH_BYPASS_ROLES.includes(req.user.role)
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

  const branchFilter = getBranchFilter(req)
  const currentUserId = req.user?.id || req.user?._id
  const isFullAccessRole = req.user?.role && BRANCH_BYPASS_ROLES.includes(req.user.role)
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

  const branchFilter = getBranchFilter(req)
  const currentUserId = req.user?.id || req.user?._id
  const isFullAccessRole = req.user?.role && BRANCH_BYPASS_ROLES.includes(req.user.role)
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

  const branchFilter = getBranchFilter(req)
  const currentUserId = req.user?.id || req.user?._id
  const isFullAccessRole = req.user?.role && BRANCH_BYPASS_ROLES.includes(req.user.role)
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

  const branchFilter = getBranchFilter(req)
  const currentUserId = req.user?.id || req.user?._id
  const isFullAccessRole = req.user?.role && BRANCH_BYPASS_ROLES.includes(req.user.role)
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

  const branchFilter = getBranchFilter(req)
  const created_by = req.user?.id || req.user?._id
  const isFullAccessRole = req.user?.role && BRANCH_BYPASS_ROLES.includes(req.user.role)
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

  const branchFilter = getBranchFilter(req)
  const currentUserId = req.user?.id || req.user?._id
  const isFullAccessRole = req.user?.role && BRANCH_BYPASS_ROLES.includes(req.user.role)
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
  const branchFilter = getBranchFilter(req, { allowQueryBranchId: true })
  const currentUserId = req.user?.id || req.user?._id
  const isFullAccessRole = req.user?.role && BRANCH_BYPASS_ROLES.includes(req.user.role)

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
