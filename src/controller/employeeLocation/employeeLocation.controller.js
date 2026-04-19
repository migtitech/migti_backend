import { Message, statusCodes } from '../../core/common/constant.js'
import {
  createEmployeeLocationSchema,
  listEmployeeLocationSchema,
} from '../../validator/employeeLocation/employeeLocation.validator.js'
import {
  createEmployeeLocation,
  listEmployeeLocations,
} from '../../services/employeeLocation/employeeLocation.service.js'

export const createEmployeeLocationController = async (req, res) => {
  const { error, value } = createEmployeeLocationSchema.validate(req.body, { abortEarly: false })
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

export const listEmployeeLocationsController = async (req, res) => {
  const { error, value } = listEmployeeLocationSchema.validate(req.query, { abortEarly: false })
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
