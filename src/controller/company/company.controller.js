import { Message, statusCodes } from '../../core/common/constant.js'
import {
  createCompanySchema,
  listCompanySchema,
  getCompanyByIdSchema,
  updateCompanySchema,
  deleteCompanySchema,
} from '../../validator/company/company.validator.js'
import {
  addCompany,
  listCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany,
} from '../../services/company/company.service.js'

export const createCompanyController = async (req, res) => {
  const { error, value } = createCompanySchema.validate(req.body, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const result = await addCompany(value)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Company created successfully',
    data: result,
  })
}

export const listCompaniesController = async (req, res) => {
  const { error, value } = listCompanySchema.validate(req.query, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const result = await listCompanies(value)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Companies retrieved successfully',
    data: result,
  })
}

export const getCompanyByIdController = async (req, res) => {
  const { error, value } = getCompanyByIdSchema.validate(req.query, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const result = await getCompanyById(value)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Company details retrieved successfully',
    data: result,
  })
}

export const updateCompanyController = async (req, res) => {
  const { error, value } = updateCompanySchema.validate(
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

  const result = await updateCompany(value)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Company updated successfully',
    data: result,
  })
}

export const deleteCompanyController = async (req, res) => {
  const { error, value } = deleteCompanySchema.validate(req.query, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const result = await deleteCompany(value)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Company deleted successfully',
    data: result,
  })
}
