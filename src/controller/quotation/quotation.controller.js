import { Message, statusCodes } from '../../core/common/constant.js'
import { BRANCH_BYPASS_ROLES } from '../../core/common/constant.js'
import { getBranchFilter } from '../../core/helpers/branchFilter.js'
import {
  listQuotationSchema,
  getQuotationByIdSchema,
  updateQuotationSchema,
  updateQuotationStatusSchema,
} from '../../validator/quotation/quotation.validator.js'
import {
  listQuotations,
  getQuotationById,
  updateQuotation,
  updateQuotationStatus,
} from '../../services/quotation/quotation.service.js'

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

  const branchFilter = getBranchFilter(req, { allowQueryBranchId: true })
  const currentUserId = req.user?.id || req.user?._id
  const isFullAccessRole = req.user?.role && BRANCH_BYPASS_ROLES.includes(req.user.role)
  const result = await listQuotations({
    ...value,
    branchFilter,
    currentUserId: currentUserId || null,
    isFullAccessRole: !!isFullAccessRole,
  })
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Quotations retrieved successfully',
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

  const branchFilter = getBranchFilter(req)
  const currentUserId = req.user?.id || req.user?._id
  const isFullAccessRole = req.user?.role && BRANCH_BYPASS_ROLES.includes(req.user.role)
  const result = await getQuotationById({
    ...value,
    branchFilter,
    currentUserId: currentUserId || null,
    isFullAccessRole: !!isFullAccessRole,
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
  const result = await updateQuotation({ ...value, branchFilter })
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Quotation updated successfully',
    data: result,
  })
}

export const updateQuotationStatusController = async (req, res) => {
  const { error, value } = updateQuotationStatusSchema.validate(
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
  const result = await updateQuotationStatus({ ...value, branchFilter })
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Quotation status updated successfully',
    data: result,
  })
}
