import { Message, statusCodes } from '../../core/common/constant.js'
import { getBranchFilter, getEffectiveBranchIdForCreate } from '../../core/helpers/branchFilter.js'
import {
  createPoEntrySchema,
  createBillingEntrySchema,
  poBillingAnalyticsSchema,
} from '../../validator/poBilling/poBilling.validator.js'
import {
  createPoEntry,
  createBillingEntry,
  getPoBillingAnalytics,
  getPoBillingFormOptions,
} from '../../services/poBilling/poBilling.service.js'

const normalizeRole = (role) =>
  String(role || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')

const hasPoFormBypass = (role) => {
  const normalized = normalizeRole(role)
  if (['back_office_exicutive', 'back_office_executive', 'boe'].includes(normalized)) return true
  return normalized.replace(/_/g, '').includes('backoffice')
}

export const createPoEntryController = async (req, res) => {
  const { error, value } = createPoEntrySchema.validate(req.body, { abortEarly: false })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const branchId = getEffectiveBranchIdForCreate(req, value.branchId)
  const created_by = req.user?.id || req.user?._id || null
  const result = await createPoEntry({ ...value, branchId, created_by })

  return res.status(statusCodes.created).json({
    success: true,
    message: 'PO entry added successfully',
    data: result,
  })
}

export const createBillingEntryController = async (req, res) => {
  const { error, value } = createBillingEntrySchema.validate(req.body, { abortEarly: false })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const branchId = getEffectiveBranchIdForCreate(req, value.branchId)
  const created_by = req.user?.id || req.user?._id || null
  const result = await createBillingEntry({ ...value, branchId, created_by })

  return res.status(statusCodes.created).json({
    success: true,
    message: 'Billing entry added successfully',
    data: result,
  })
}

export const getPoBillingAnalyticsController = async (req, res) => {
  const { error, value } = poBillingAnalyticsSchema.validate(req.query, { abortEarly: false })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const branchFilter = getBranchFilter(req, { allowQueryBranchId: true })
  const result = await getPoBillingAnalytics({ ...value, branchFilter })
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'PO/Billing analytics retrieved successfully',
    data: result,
  })
}

export const getPoBillingFormOptionsController = async (req, res) => {
  const branchFilter = hasPoFormBypass(req.user?.role)
    ? {}
    : getBranchFilter(req, { allowQueryBranchId: true })
  const result = await getPoBillingFormOptions({ branchFilter })
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'PO/Billing form options retrieved successfully',
    data: result,
  })
}
