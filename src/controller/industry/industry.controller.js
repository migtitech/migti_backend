import { Message, statusCodes, BRANCH_BYPASS_ROLES } from '../../core/common/constant.js'
import { getBranchFilter, getEffectiveBranchIdForCreate } from '../../core/helpers/branchFilter.js'

const normalizeRole = (role) => String(role || '').trim().toLowerCase().replace(/[\s-]+/g, '_')
const isBackOfficeRole = (role) => {
  const normalized = normalizeRole(role)
  if (['back_office_exicutive', 'back_office_executive', 'boe'].includes(normalized)) return true
  return normalized.replace(/_/g, '').includes('backoffice')
}
const hasOwnershipBypass = (role) => {
  const normalized = normalizeRole(role)
  if (BRANCH_BYPASS_ROLES.includes(normalized)) return true
  return isBackOfficeRole(normalized)
}
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

  const branchId = getEffectiveBranchIdForCreate(req, value.branchId)
  const result = await addIndustry({ ...value, branchId })
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

  const branchFilter = getBranchFilter(req, { allowQueryBranchId: true })
  const currentUserId = req.user?.id || req.user?._id
  const isFullAccessRole = hasOwnershipBypass(req.user?.role)
  const result = await listIndustries({
    ...value,
    branchFilter,
    currentUserId: currentUserId || null,
    isFullAccessRole: !!isFullAccessRole,
  })
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

  const branchFilter = getBranchFilter(req)
  const currentUserId = req.user?.id || req.user?._id
  const isFullAccessRole = hasOwnershipBypass(req.user?.role)
  const result = await getIndustryById({
    ...value,
    branchFilter,
    currentUserId: currentUserId || null,
    isFullAccessRole: !!isFullAccessRole,
  })
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

  const branchFilter = getBranchFilter(req)
  const currentUserId = req.user?.id || req.user?._id
  const isFullAccessRole = hasOwnershipBypass(req.user?.role)
  const result = await updateIndustry({
    ...value,
    branchFilter,
    currentUserId: currentUserId || null,
    isFullAccessRole: !!isFullAccessRole,
  })
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

  const branchFilter = getBranchFilter(req)
  const currentUserId = req.user?.id || req.user?._id
  const isFullAccessRole = hasOwnershipBypass(req.user?.role)
  const result = await deleteIndustry({
    ...value,
    branchFilter,
    currentUserId: currentUserId || null,
    isFullAccessRole: !!isFullAccessRole,
  })
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Industry deleted successfully',
    data: result,
  })
}
