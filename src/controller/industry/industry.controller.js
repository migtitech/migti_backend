import { Message, statusCodes } from '../../core/common/constant.js'
import {
  createIndustrySchema,
  listIndustrySchema,
  getIndustryByIdSchema,
  updateIndustrySchema,
  deleteIndustrySchema,
} from '../../validator/industry/industry.validator.js'
import {
  addIndustry,
  listIndustries,
  getIndustryById,
  updateIndustry,
  deleteIndustry,
} from '../../services/industry/industry.service.js'

export const createIndustryController = async (req, res) => {
  const { error, value } = createIndustrySchema.validate(req.body, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const result = await addIndustry(value)
  return res.status(statusCodes.created).json({
    success: true,
    message: 'Industry created successfully',
    data: result,
  })
}

export const listIndustriesController = async (req, res) => {
  const { error, value } = listIndustrySchema.validate(req.query, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const result = await listIndustries(value)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Industries retrieved successfully',
    data: result,
  })
}

export const getIndustryByIdController = async (req, res) => {
  const { error, value } = getIndustryByIdSchema.validate(req.query, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const result = await getIndustryById(value)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Industry details retrieved successfully',
    data: result,
  })
}

export const updateIndustryController = async (req, res) => {
  const { error, value } = updateIndustrySchema.validate(
    { ...req.body, ...req.query },
    {
      abortEarly: false,
    },
  )
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const result = await updateIndustry(value)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Industry updated successfully',
    data: result,
  })
}

export const deleteIndustryController = async (req, res) => {
  const { error, value } = deleteIndustrySchema.validate(req.query, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const result = await deleteIndustry(value)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Industry deleted successfully',
    data: result,
  })
}
