import { Message, statusCodes, errorCodes } from '../../core/common/constant.js'
import CustomError from '../../utils/exception.js'
import {
  createCompanyDocumentSchema,
  listCompanyDocumentSchema,
  deleteCompanyDocumentSchema,
} from '../../validator/companyDocument/companyDocument.validator.js'
import {
  createCompanyDocument,
  listCompanyDocuments,
  deleteCompanyDocument,
} from '../../services/companyDocument/companyDocument.service.js'

const HOD_ROLES = new Set(['head_of_department', 'hod'])

const assertHeadOfDepartment = (req) => {
  const role = String(req.user?.role || '').toLowerCase()
  if (!HOD_ROLES.has(role)) {
    throw new CustomError(
      statusCodes.forbidden,
      'Only Head of Department can manage company documents',
      errorCodes.forbidden
    )
  }
}

export const createCompanyDocumentController = async (req, res) => {
  assertHeadOfDepartment(req)

  const { error, value } = createCompanyDocumentSchema.validate(req.body, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  if (!req.file) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: 'Document file is required. Use field name "catalog".',
    })
  }

  const result = await createCompanyDocument({
    ...value,
    file: req.file,
    createdBy: req.user?.id || req.user?._id || null,
  })

  return res.status(statusCodes.created).json({
    success: true,
    message: 'Company document uploaded successfully',
    data: result,
  })
}

export const listCompanyDocumentsController = async (req, res) => {
  const { error, value } = listCompanyDocumentSchema.validate(req.query, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const result = await listCompanyDocuments(value)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Company documents retrieved successfully',
    data: result,
  })
}

export const deleteCompanyDocumentController = async (req, res) => {
  assertHeadOfDepartment(req)

  const { error, value } = deleteCompanyDocumentSchema.validate(req.query, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const result = await deleteCompanyDocument(value)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Company document deleted successfully',
    data: result,
  })
}
