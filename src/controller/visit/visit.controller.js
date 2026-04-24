import { Message, statusCodes } from '../../core/common/constant.js'
import {
  getBranchFilter,
  getEffectiveBranchIdForCreate,
} from '../../core/helpers/branchFilter.js'
import {
  completeVisitWithRemarkSchema,
  createVisitSchema,
  listVisitSchema,
} from '../../validator/visit/visit.validator.js'
import {
  completeVisitWithRemark,
  createVisit,
  listVisits,
} from '../../services/visit/visit.service.js'

export const createVisitController = async (req, res) => {
  const { error, value } = createVisitSchema.validate(req.body, {
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
  const created_by = req.user?.id || req.user?._id || null
  const result = await createVisit({ ...value, branchId, created_by })

  return res.status(statusCodes.created).json({
    success: true,
    message: 'Visit created successfully',
    data: result,
  })
}

export const listVisitsController = async (req, res) => {
  const { error, value } = listVisitSchema.validate(req.query, {
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
  const result = await listVisits({ ...value, branchFilter })

  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Visits retrieved successfully',
    data: result,
  })
}

export const myVisitsController = async (req, res) => {
  const { error, value } = listVisitSchema.validate(req.query, {
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
  const employeeId = req.user?.id || req.user?._id
  const result = await listVisits({
    ...value,
    branchFilter,
    extraFilter: { employeeId },
  })

  return res.status(statusCodes.ok).json({
    success: true,
    message: 'My visits retrieved successfully',
    data: result,
  })
}

export const completeVisitWithRemarkController = async (req, res) => {
  const { error, value } = completeVisitWithRemarkSchema.validate(req.body, {
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
  const employeeId = req.user?.id || req.user?._id
  const result = await completeVisitWithRemark({
    ...value,
    employeeId,
    branchFilter,
  })

  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Visit completed with remark',
    data: result,
  })
}
