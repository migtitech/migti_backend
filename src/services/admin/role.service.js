import RoleModel from '../../models/role.model.js'
import CustomError from '../../utils/exception.js'
import { statusCodes, errorCodes } from '../../core/common/constant.js'

export const addRole = async ({ name, description, permissions }) => {
  const existingRole = await RoleModel.findOne({ name })
  if (existingRole) {
    throw new CustomError(
      statusCodes.conflict,
      'Role already exists',
      errorCodes.already_exist
    )
  }

  const role = await RoleModel.create({ name, description, permissions })
  return role.toObject()
}

export const listRoles = async ( page = 1,
  limit = 10,
  search = ''
) => {
  const skip = (page - 1) * limit
  const filter = {}

    if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { permissions: { $regex: search, $options: 'i' } }
    ]
  }

  const totalItems = await RoleModel.countDocuments()

  const roles = await RoleModel.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()

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
  const role = await RoleModel.findById(roleId).lean()
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
  const role = await RoleModel.findById(roleId).lean()
  if (!role) {
    throw new CustomError(
      statusCodes.notFound,
      'Role not found',
      errorCodes.not_found
    )
  }

  const updatedRole = await RoleModel.findByIdAndUpdate(roleId, updateData, {
    new: true,
    runValidators: true,
  }).lean()

  return updatedRole
}

export const deleteRole = async ({ roleId }) => {
  const role = await RoleModel.findById(roleId).lean()
  if (!role) {
    throw new CustomError(
      statusCodes.notFound,
      'Role not found',
      errorCodes.not_found
    )
  }

  await RoleModel.findByIdAndDelete(roleId)

  return {
    deletedRole: {
      id: role._id,
      name: role.name,
      deletedAt: new Date().toISOString(),
    },
  }
}
