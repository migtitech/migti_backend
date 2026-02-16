import { Message, statusCodes } from '../../core/common/constant.js'
import {
  createIndustryBranchSchema,
  listIndustryBranchSchema,
  getIndustryBranchByIdSchema,
  updateIndustryBranchSchema,
  deleteIndustryBranchSchema,
} from '../../validator/industryBranch/industryBranch.validator.js'
import {
  addIndustryBranch,
  listIndustryBranches,
  getIndustryBranchById,
  updateIndustryBranch,
  deleteIndustryBranch,
} from '../../services/industryBranch/industryBranch.service.js'

export const createIndustryBranchController = async (req, res) => {
  const { error, value } = createIndustryBranchSchema.validate(req.body, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const result = await addIndustryBranch(value)
  return res.status(statusCodes.created).json({
    success: true,
    message: 'Industry branch created successfully',
    data: result,
  })
}

export const listIndustryBranchesController = async (req, res) => {
  const { error, value } = listIndustryBranchSchema.validate(req.query, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const result = await listIndustryBranches(value)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Industry branches retrieved successfully',
    data: result,
  })
}

export const getIndustryBranchByIdController = async (req, res) => {
  const { error, value } = getIndustryBranchByIdSchema.validate(req.query, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const result = await getIndustryBranchById(value)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Industry branch details retrieved successfully',
    data: result,
  })
}

export const updateIndustryBranchController = async (req, res) => {
  const { error, value } = updateIndustryBranchSchema.validate(
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

  const result = await updateIndustryBranch(value)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Industry branch updated successfully',
    data: result,
  })
}

export const deleteIndustryBranchController = async (req, res) => {
  const { error, value } = deleteIndustryBranchSchema.validate(req.query, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const result = await deleteIndustryBranch(value)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Industry branch deleted successfully',
    data: result,
  })
}
