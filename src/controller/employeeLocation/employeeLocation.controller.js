import { Message, statusCodes, errorCodes } from '../../core/common/constant.js'
import CustomError from '../../utils/exception.js'
import {
  createEmployeeLocationSchema,
  listEmployeeLocationSchema,
  listTeamLatestLocationsSchema,
  listEmployeeLocationHistoryBinnedSchema,
} from '../../validator/employeeLocation/employeeLocation.validator.js'
import {
  createEmployeeLocation,
  getLatestEmployeeLocation,
  listEmployeeLocations,
  listTeamEmployeesWithLatestLocation,
  listEmployeeLocationHistoryBinned,
} from '../../services/employeeLocation/employeeLocation.service.js'

/** Head of department (and legacy `hod`) — team location dashboards. */
const TEAM_LOCATION_ROLES = new Set(['head_of_department', 'hod'])

const assertHeadOfDepartmentTeamLocations = (req) => {
  const role = String(req.user?.role || '').toLowerCase()
  if (!TEAM_LOCATION_ROLES.has(role)) {
    throw new CustomError(
      statusCodes.forbidden,
      'Forbidden',
      errorCodes.forbidden
    )
  }
}

export const createEmployeeLocationController = async (req, res) => {
  const { error, value } = createEmployeeLocationSchema.validate(req.body, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const tokenEmployeeId = req.user?.id || req.user?._id || null
  const employeeId = value.employeeId || tokenEmployeeId
  const result = await createEmployeeLocation({
    ...value,
    employeeId,
    created_by: tokenEmployeeId,
  })

  return res.status(statusCodes.created).json({
    success: true,
    message: 'Employee location stored successfully',
    data: result,
  })
}

export const getLatestEmployeeLocationController = async (req, res) => {
  const employeeId = req.user?.id || req.user?._id
  if (!employeeId) {
    return res.status(statusCodes.unauthorized).json({
      success: false,
      message: 'Unauthorized',
    })
  }

  const result = await getLatestEmployeeLocation({ employeeId })
  return res.status(statusCodes.ok).json({
    success: true,
    message: result
      ? 'Latest employee location retrieved successfully'
      : 'No location records found',
    data: result,
  })
}

export const listEmployeeLocationsController = async (req, res) => {
  const { error, value } = listEmployeeLocationSchema.validate(req.query, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const result = await listEmployeeLocations(value)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Employee locations retrieved successfully',
    data: result,
  })
}

export const listTeamLatestLocationsController = async (req, res) => {
  assertHeadOfDepartmentTeamLocations(req)

  const { error } = listTeamLatestLocationsSchema.validate(req.query, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const employees = await listTeamEmployeesWithLatestLocation()
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Team locations retrieved successfully',
    data: { employees },
  })
}

export const listEmployeeLocationHistoryBinnedController = async (req, res) => {
  assertHeadOfDepartmentTeamLocations(req)

  const { error, value } = listEmployeeLocationHistoryBinnedSchema.validate(
    req.query,
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

  const result = await listEmployeeLocationHistoryBinned(value)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Location history retrieved successfully',
    data: result,
  })
}
