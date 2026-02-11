import { Message, statusCodes } from '../../core/common/constant.js'
import {
  createAreaSchema,
  listAreaSchema,
  getAreaByIdSchema,
  updateAreaSchema,
  deleteAreaSchema,
} from '../../validator/area/area.validator.js'
import {
  addArea,
  listAreas,
  getAreaById,
  updateArea,
  deleteArea,
} from '../../services/area/area.service.js'

export const createAreaController = async (req, res) => {
  const { error, value } = createAreaSchema.validate(req.body, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const result = await addArea(value)
  return res.status(statusCodes.created).json({
    success: true,
    message: 'Area created successfully',
    data: result,
  })
}

export const listAreasController = async (req, res) => {
  const { error, value } = listAreaSchema.validate(req.query, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const result = await listAreas(value)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Areas retrieved successfully',
    data: result,
  })
}

export const getAreaByIdController = async (req, res) => {
  const { error, value } = getAreaByIdSchema.validate(req.query, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const result = await getAreaById(value)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Area details retrieved successfully',
    data: result,
  })
}

export const updateAreaController = async (req, res) => {
  const { error, value } = updateAreaSchema.validate(
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

  const result = await updateArea(value)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Area updated successfully',
    data: result,
  })
}

export const deleteAreaController = async (req, res) => {
  const { error, value } = deleteAreaSchema.validate(req.query, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const result = await deleteArea(value)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Area deleted successfully',
    data: result,
  })
}
