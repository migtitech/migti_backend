import { Message, statusCodes } from '../../core/common/constant.js'
import {
  createGroupSchema,
  listGroupSchema,
  getGroupByIdSchema,
  updateGroupSchema,
  deleteGroupSchema,
} from '../../validator/group/group.validator.js'
import {
  addGroup,
  listGroups,
  getGroupById,
  updateGroup,
  deleteGroup,
} from '../../services/group/group.service.js'

export const createGroupController = async (req, res) => {
  const { error, value } = createGroupSchema.validate(req.body, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const result = await addGroup(value)
  return res.status(statusCodes.created).json({
    success: true,
    message: 'Group created successfully',
    data: result,
  })
}

export const listGroupsController = async (req, res) => {
  const { error, value } = listGroupSchema.validate(req.query, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const result = await listGroups(value)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Groups retrieved successfully',
    data: result,
  })
}

export const getGroupByIdController = async (req, res) => {
  const { error, value } = getGroupByIdSchema.validate(req.query, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const result = await getGroupById(value)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Group details retrieved successfully',
    data: result,
  })
}

export const updateGroupController = async (req, res) => {
  const { error, value } = updateGroupSchema.validate(
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

  const result = await updateGroup(value)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Group updated successfully',
    data: result,
  })
}

export const deleteGroupController = async (req, res) => {
  const { error, value } = deleteGroupSchema.validate(req.query, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const result = await deleteGroup(value)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Group deleted successfully',
    data: result,
  })
}
