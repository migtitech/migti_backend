import { Message, statusCodes } from '../../core/common/constant.js'
import {
  createRawQuerySchema,
  listRawQuerySchema,
  getRawQueryByIdSchema,
  updateRawQuerySchema,
  deleteRawQuerySchema,
} from '../../validator/rawQuery/rawQuery.validator.js'
import {
  addRawQuery,
  listRawQueries,
  getRawQueryById,
  updateRawQuery,
  deleteRawQuery,
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

  const result = await addRawQuery(value)
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

  const result = await listRawQueries(value)
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

  const result = await getRawQueryById(value)
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

  const result = await updateRawQuery(value)
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

  const result = await deleteRawQuery(value)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Raw query deleted successfully',
    data: result,
  })
}
