import {
  findRoleByName,
  createRole,
  countRoles,
  findRoles,
  findRoleById,
  updateRoleById,
  deleteRoleById,
} from '../../repository/role.repository.js'
import CustomError from '../../utils/exception.js'
import { statusCodes, errorCodes } from '../../core/common/constant.js'

export const addRole = async ({ name, description, permissions }) => {
  const existingRole = await findRoleByName(name)
  if (existingRole) {
    throw new CustomError(
      statusCodes.conflict,
      'Role already exists',
      errorCodes.already_exist
    )
  }

  const role = await createRole({ name, description, permissions })
  return role.toObject()
}

export const listRoles = async (page = 1, limit = 10, search = '') => {
  const skip = (page - 1) * limit
  const filter = {}

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { permissions: { $regex: search, $options: 'i' } },
    ]
  }

  const totalItems = await countRoles()

  const roles = await findRoles(filter, { skip, limit })

  const totalPages = Math.ceil(totalItems / limit)

  return {
    roles,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  }
}

export const getRoleById = async ({ roleId }) => {
  const role = await findRoleById(roleId)
  if (!role) {
    throw new CustomError(
      statusCodes.notFound,
      'Role not found',
      errorCodes.not_found
    )
  }
  return role
}

export const updateRole = async ({ roleId, ...updateData }) => {
  const role = await findRoleById(roleId)
  if (!role) {
    throw new CustomError(
      statusCodes.notFound,
      'Role not found',
      errorCodes.not_found
    )
  }

  const updatedRole = await updateRoleById(roleId, updateData)

  return updatedRole
}

export const deleteRole = async ({ roleId }) => {
  const role = await findRoleById(roleId)
  if (!role) {
    throw new CustomError(
      statusCodes.notFound,
      'Role not found',
      errorCodes.not_found
    )
  }

  await deleteRoleById(roleId)

  return {
    deletedRole: {
      id: role._id,
      name: role.name,
      deletedAt: new Date().toISOString(),
    },
  }
}
