import AdminModel from '../models/admin.model.js'

export const findAdminByEmail = (email) =>
  AdminModel.findOne({ email }).lean()

export const findAdminByEmailExists = (email) => AdminModel.findOne({ email })

export const createAdmin = (adminData) => AdminModel.create(adminData)

export const countAdmins = () => AdminModel.countDocuments()

export const findAdmins = ({ skip, limit }) =>
  AdminModel.find()
    .select('-password')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()

export const findAdminById = (adminId) =>
  AdminModel.findById(adminId).select('-password').lean()

export const findAdminByIdRaw = (adminId) => AdminModel.findById(adminId).lean()

export const updateAdminById = (adminId, updateData) =>
  AdminModel.findByIdAndUpdate(adminId, updateData, {
    new: true,
    runValidators: true,
  })
    .select('-password')
    .lean()

export const deleteAdminById = (adminId) => AdminModel.findByIdAndDelete(adminId)

export const findAdminByIdWithNameEmail = (performerId) =>
  AdminModel.findById(performerId).select('name email').lean()
