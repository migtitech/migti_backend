import { Message, statusCodes } from '../../core/common/constant.js'
import {
  createCompanyBranchSchema,
  listCompanyBranchSchema,
  getCompanyBranchByIdSchema,
  updateCompanyBranchSchema,
  deleteCompanyBranchSchema,
} from '../../validator/companyBranch/companyBranch.validator.js'
import {
  addCompanyBranch,
  listCompanyBranches,
  getCompanyBranchById,
  updateCompanyBranch,
  deleteCompanyBranch,
} from '../../services/companyBranch/companyBranch.service.js'

export const createCompanyBranchController = async (req, res) => {
  const { error, value } = createCompanyBranchSchema.validate(req.body, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const result = await addCompanyBranch(value)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Company branch created successfully',
    data: result,
  })
}

export const listCompanyBranchesController = async (req, res) => {
  const { error, value } = listCompanyBranchSchema.validate(req.query, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const result = await listCompanyBranches(value)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Company branches retrieved successfully',
    data: result,
  })
}

export const getCompanyBranchByIdController = async (req, res) => {
  const { error, value } = getCompanyBranchByIdSchema.validate(req.query, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const result = await getCompanyBranchById(value)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Company branch details retrieved successfully',
    data: result,
  })
}

export const updateCompanyBranchController = async (req, res) => {
  const { error, value } = updateCompanyBranchSchema.validate(
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

  const result = await updateCompanyBranch(value)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Company branch updated successfully',
    data: result,
  })
}

export const deleteCompanyBranchController = async (req, res) => {
  const { error, value } = deleteCompanyBranchSchema.validate(req.query, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const result = await deleteCompanyBranch(value)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Company branch deleted successfully',
    data: result,
  })
}
