import { Message, statusCodes } from '../../core/common/constant.js'
import {
  createRoleSchema,
  listRoleSchema,
  getRoleByIdSchema,
  updateRoleSchema,
  deleteRoleSchema,
} from '../../validator/admin/role.validator.js'
import {
  addRole,
  listRoles,
  getRoleById,
  updateRole,
  deleteRole,
} from '../../services/admin/role.service.js'

export const createRoleController = async (req, res) => {
  const { error, value } = createRoleSchema.validate(req.body, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const result = await addRole(value)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Role created successfully',
    data: result,
  })
}

export const listRolesController = async (req, res) => {
  const { error, value } = listRoleSchema.validate(req.query, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const result = await listRoles( value.page,
    value.limit,
    value.search)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Roles retrieved successfully',
    data: result,
  })
}

export const getRoleByIdController = async (req, res) => {
  const { error, value } = getRoleByIdSchema.validate(req.query, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const result = await getRoleById(value)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Role details retrieved successfully',
    data: result,
  })
}

export const updateRoleController = async (req, res) => {
  const { error, value } = updateRoleSchema.validate(
    { ...req.body, ...req.query },
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

  const result = await updateRole(value)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Role updated successfully',
    data: result,
  })
}

export const deleteRoleController = async (req, res) => {
  const { error, value } = deleteRoleSchema.validate(req.query, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const result = await deleteRole(value)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Role deleted successfully',
    data: result,
  })
}
