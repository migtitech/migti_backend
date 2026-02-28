import { Message, statusCodes } from '../../core/common/constant.js'
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
} from '../../services/query/query.service.js'
import { convertQueryToQuotationSchema } from '../../validator/query/query.validator.js'
import { convertQueryToQuotation } from '../../services/query/query.service.js'

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
  const result = await listQueries({ ...value, branchFilter })
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
  const result = await getQueryById({ ...value, branchFilter })
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
  const result = await updateQuery({ ...value, branchFilter })
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
  const result = await deleteQuery({ ...value, branchFilter })
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
  const result = await listQueryActivities({ ...value, branchFilter })
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
  const result = await recordQueryActivity({ ...value, branchFilter })
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Activity recorded successfully',
    data: result,
  })
}

export const convertQueryToQuotationController = async (req, res) => {
  const { error, value } = convertQueryToQuotationSchema.validate(req.query, {
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
  const result = await convertQueryToQuotation({ ...value, created_by, branchFilter })
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Query converted to quotation successfully',
    data: result,
  })
}
