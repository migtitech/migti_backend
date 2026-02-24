import { Message, statusCodes } from '../../core/common/constant.js'
import { getBranchFilter, getBranchIdForCreate } from '../../core/helpers/branchFilter.js'
import {
  createRawQuerySchema,
  listRawQuerySchema,
  getRawQueryByIdSchema,
  updateRawQuerySchema,
  deleteRawQuerySchema,
  listRawQueryActivitiesSchema,
  recordRawQueryActivitySchema,
} from '../../validator/rawQuery/rawQuery.validator.js'
import {
  addRawQuery,
  listRawQueries,
  getRawQueryById,
  updateRawQuery,
  deleteRawQuery,
  listRawQueryActivities,
  recordRawQueryActivity,
} from '../../services/rawQuery/rawQuery.service.js'

export const createRawQueryController = async (req, res) => {
  const { error, value } = createRawQuerySchema.validate(req.body, {
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
  const result = await addRawQuery({ ...value, created_by, branchId })
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Raw query created successfully',
    data: result,
  })
}

export const listRawQueriesController = async (req, res) => {
  const { error, value } = listRawQuerySchema.validate(req.query, {
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
  const result = await listRawQueries({ ...value, branchFilter })
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Raw queries retrieved successfully',
    data: result,
  })
}

export const getRawQueryByIdController = async (req, res) => {
  const { error, value } = getRawQueryByIdSchema.validate(req.query, {
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
  const result = await getRawQueryById({ ...value, branchFilter })
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Raw query details retrieved successfully',
    data: result,
  })
}

export const updateRawQueryController = async (req, res) => {
  const { error, value } = updateRawQuerySchema.validate(
    { ...req.body, ...req.query },
    {
      abortEarly: false,
    }
  )
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const branchFilter = getBranchFilter(req)
  const result = await updateRawQuery({ ...value, branchFilter })
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Raw query updated successfully',
    data: result,
  })
}

export const deleteRawQueryController = async (req, res) => {
  const { error, value } = deleteRawQuerySchema.validate(req.query, {
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
  const result = await deleteRawQuery({ ...value, branchFilter })
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Raw query deleted successfully',
    data: result,
  })
}

export const listRawQueryActivitiesController = async (req, res) => {
  const { error, value } = listRawQueryActivitiesSchema.validate(req.query, {
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
  const result = await listRawQueryActivities({ ...value, branchFilter })
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Raw query activities retrieved successfully',
    data: result,
  })
}

export const recordRawQueryActivityController = async (req, res) => {
  const { error, value } = recordRawQueryActivitySchema.validate(req.body, {
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
  const result = await recordRawQueryActivity({ ...value, branchFilter })
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Activity recorded successfully',
    data: result,
  })
}
