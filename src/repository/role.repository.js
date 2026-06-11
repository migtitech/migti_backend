import RoleModel from '../models/role.model.js'

export const findRoleByName = async (name) => {
  return RoleModel.findOne({ name })
}

export const createRole = async (data) => {
  return RoleModel.create(data)
}

export const countRoles = async () => {
  return RoleModel.countDocuments()
}

export const findRoles = async (filter, { skip, limit }) => {
  return RoleModel.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()
}

export const findRoleById = async (roleId) => {
  return RoleModel.findById(roleId).lean()
}

export const updateRoleById = async (roleId, updateData) => {
  return RoleModel.findByIdAndUpdate(roleId, updateData, {
    new: true,
    runValidators: true,
  }).lean()
}

export const deleteRoleById = async (roleId) => {
  return RoleModel.findByIdAndDelete(roleId)
}
