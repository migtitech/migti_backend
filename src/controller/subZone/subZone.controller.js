import { Message, statusCodes } from '../../core/common/constant.js'
import { getBranchFilter } from '../../core/helpers/branchFilter.js'
import {
  createSubZoneSchema,
  listSubZoneSchema,
  listSubZoneGroupedSchema,
  updateSubZoneSchema,
  deleteSubZoneSchema,
} from '../../validator/subZone/subZone.validator.js'
import {
  addSubZone,
  listSubZones,
  listSubZonesGroupedByBranch,
  updateSubZone,
  deleteSubZone,
} from '../../services/subZone/subZone.service.js'

export const createSubZoneController = async (req, res) => {
  const { error, value } = createSubZoneSchema.validate(req.body, { abortEarly: false })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const branchFilter = getBranchFilter(req, { allowQueryBranchId: true })
  const result = await addSubZone({ ...value, branchFilter })
  return res.status(statusCodes.created).json({
    success: true,
    message: 'Sub-zone created successfully',
    data: result,
  })
}

export const listSubZonesController = async (req, res) => {
  const { error, value } = listSubZoneSchema.validate(req.query, { abortEarly: false })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const branchFilter = getBranchFilter(req, { allowQueryBranchId: true })
  const result = await listSubZones({ ...value, branchFilter })
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Sub-zones retrieved successfully',
    data: result,
  })
}

export const listSubZonesGroupedController = async (req, res) => {
  const { error } = listSubZoneGroupedSchema.validate(req.query, { abortEarly: false })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const branchFilter = getBranchFilter(req, { allowQueryBranchId: true })
  const result = await listSubZonesGroupedByBranch({ branchFilter })
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Sub-zones grouped by zone retrieved successfully',
    data: result,
  })
}

export const updateSubZoneController = async (req, res) => {
  const { error, value } = updateSubZoneSchema.validate({ ...req.body, ...req.query }, { abortEarly: false })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const branchFilter = getBranchFilter(req, { allowQueryBranchId: true })
  const result = await updateSubZone({ ...value, branchFilter })
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Sub-zone updated successfully',
    data: result,
  })
}

export const deleteSubZoneController = async (req, res) => {
  const { error, value } = deleteSubZoneSchema.validate(req.query, { abortEarly: false })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const branchFilter = getBranchFilter(req, { allowQueryBranchId: true })
  const result = await deleteSubZone({ ...value, branchFilter })
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Sub-zone deleted successfully',
    data: result,
  })
}
