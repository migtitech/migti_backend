import { Message, statusCodes } from '../../core/common/constant.js'
import { BRANCH_BYPASS_ROLES } from '../../core/common/constant.js'
import { getBranchFilter } from '../../core/helpers/branchFilter.js'
import {
  listQuotationSchema,
  listQuotationsByIndustrySchema,
  getQuotationByIdSchema,
  updateQuotationSchema,
  updateQuotationStatusSchema,
  deleteQuotationSchema,
  listQuotationSnapshotsSchema,
} from '../../validator/quotation/quotation.validator.js'
import {
  listQuotations,
  getQuotationById,
  updateQuotation,
  updateQuotationStatus,
  deleteQuotation,
  listQuotationSnapshots,
} from '../../services/quotation/quotation.service.js'
import { exportQuotationPdf } from '../../services/quotation/quotationPdfExport.service.js'
import { listRateLogsSchema } from '../../validator/rateLog/rateLog.validator.js'
import { listRateLogs } from '../../services/rateLog/rateLog.service.js'

const normalizeRole = (role) =>
  String(role || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
const isBackOfficeRole = (role) => {
  const normalized = normalizeRole(role)
  if (
    ['back_office_exicutive', 'back_office_executive', 'boe'].includes(
      normalized
    )
  )
    return true
  return normalized.replace(/_/g, '').includes('backoffice')
}
const hasOwnershipBypass = (role) => {
  const normalized = normalizeRole(role)
  if (BRANCH_BYPASS_ROLES.includes(normalized)) return true
  return isBackOfficeRole(normalized)
}
const resolveQuotationBranchFilter = (req, options = {}) => {
  // Back office can view/manage query/quotation data across all employees.
  if (isBackOfficeRole(req?.user?.role)) return {}
  return getBranchFilter(req, options)
}

export const listQuotationsController = async (req, res) => {
  const { error, value } = listQuotationSchema.validate(req.query, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const branchFilter = resolveQuotationBranchFilter(req, {
    allowQueryBranchId: true,
  })
  const currentUserId = req.user?.id || req.user?._id
  const isFullAccessRole = hasOwnershipBypass(req.user?.role)
  const result = await listQuotations({
    ...value,
    branchFilter,
    currentUserId: currentUserId || null,
    isFullAccessRole: !!isFullAccessRole,
    role: req.user?.role || '',
  })
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Quotations retrieved successfully',
    data: result,
  })
}

export const listQuotationsByIndustryController = async (req, res) => {
  const { error, value } = listQuotationsByIndustrySchema.validate(req.query, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const branchFilter = resolveQuotationBranchFilter(req, {
    allowQueryBranchId: true,
  })
  const currentUserId = req.user?.id || req.user?._id
  const isFullAccessRole = hasOwnershipBypass(req.user?.role)
  const result = await listQuotations({
    ...value,
    branchFilter,
    currentUserId: currentUserId || null,
    isFullAccessRole: !!isFullAccessRole,
    role: req.user?.role || '',
  })
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Quotations by industry retrieved successfully',
    data: result,
  })
}

export const listQuotationSnapshotsController = async (req, res) => {
  const { error, value } = listQuotationSnapshotsSchema.validate(req.query, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const branchFilter = resolveQuotationBranchFilter(req)
  const currentUserId = req.user?.id || req.user?._id
  const isFullAccessRole = hasOwnershipBypass(req.user?.role)
  const result = await listQuotationSnapshots({
    ...value,
    branchFilter,
    currentUserId: currentUserId || null,
    isFullAccessRole: !!isFullAccessRole,
    role: req.user?.role || '',
  })
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Quotation snapshots retrieved successfully',
    data: result,
  })
}

export const getQuotationByIdController = async (req, res) => {
  const { error, value } = getQuotationByIdSchema.validate(req.query, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const branchFilter = resolveQuotationBranchFilter(req)
  const currentUserId = req.user?.id || req.user?._id
  const isFullAccessRole = hasOwnershipBypass(req.user?.role)
  const result = await getQuotationById({
    ...value,
    branchFilter,
    currentUserId: currentUserId || null,
    isFullAccessRole: !!isFullAccessRole,
    role: req.user?.role || '',
  })
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Quotation details retrieved successfully',
    data: result,
  })
}

export const updateQuotationController = async (req, res) => {
  const { error, value } = updateQuotationSchema.validate(
    { ...req.body, ...req.query },
    { abortEarly: false }
  )
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const branchFilter = resolveQuotationBranchFilter(req)
  const currentUserId = req.user?.id || req.user?._id
  const isFullAccessRole = hasOwnershipBypass(req.user?.role)
  const result = await updateQuotation({
    ...value,
    branchFilter,
    currentUserId: currentUserId || null,
    isFullAccessRole: !!isFullAccessRole,
    role: req.user?.role || '',
  })
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Quotation updated successfully',
    data: result,
  })
}

export const updateQuotationStatusController = async (req, res) => {
  const { error, value } = updateQuotationStatusSchema.validate(
    { ...req.body, ...req.query },
    { abortEarly: false }
  )
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const branchFilter = resolveQuotationBranchFilter(req)
  const currentUserId = req.user?.id || req.user?._id
  const isFullAccessRole = hasOwnershipBypass(req.user?.role)
  const result = await updateQuotationStatus({
    ...value,
    branchFilter,
    currentUserId: currentUserId || null,
    currentUserRole: req.user?.role || '',
    isFullAccessRole: !!isFullAccessRole,
    approvedBy: currentUserId || null,
    role: req.user?.role || '',
  })
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Quotation status updated successfully',
    data: result,
  })
}

export const exportQuotationPdfController = async (req, res) => {
  const { error, value } = getQuotationByIdSchema.validate(req.query, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const branchFilter = resolveQuotationBranchFilter(req)
  const currentUserId = req.user?.id || req.user?._id
  const isFullAccessRole = hasOwnershipBypass(req.user?.role)

  const { buffer, quotationCode } = await exportQuotationPdf({
    ...value,
    branchFilter,
    currentUserId: currentUserId || null,
    isFullAccessRole: !!isFullAccessRole,
    role: req.user?.role || '',
  })
  const fileName = `quotation-${quotationCode || value.quotationId}-${new Date().toISOString().slice(0, 10)}.pdf`
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
  res.setHeader('Content-Length', buffer.length)
  res.end(buffer, 'binary')
}

export const deleteQuotationController = async (req, res) => {
  const { error, value } = deleteQuotationSchema.validate(req.query, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const branchFilter = resolveQuotationBranchFilter(req, {
    allowQueryBranchId: true,
  })
  const result = await deleteQuotation({
    quotationId: value.quotationId,
    branchFilter,
  })
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Quotation deleted successfully',
    data: result,
  })
}

export const listRateLogsController = async (req, res) => {
  const { error, value } = listRateLogsSchema.validate(req.query, {
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
  const result = await listRateLogs({
    ...value,
    branchFilter,
  })

  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Rate logs retrieved successfully',
    data: result,
  })
}
