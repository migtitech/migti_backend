import { Message, statusCodes } from '../../core/common/constant.js'
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

  const result = await addQuery(value)
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

  const result = await listQueries(value)
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

  const result = await getQueryById(value)
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

  const result = await updateQuery(value)
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

  const result = await deleteQuery(value)
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

  const result = await listQueryActivities(value)
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

  const result = await recordQueryActivity(value)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Activity recorded successfully',
    data: result,
  })
}
