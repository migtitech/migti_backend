import SuperAdminModel from '../models/super.admin.js'

export const findSuperAdminByEmail = (email) =>
  SuperAdminModel.findOne({ email }).lean()

export const findSuperAdminByIdWithNameEmail = (performerId) =>
  SuperAdminModel.findById(performerId).select('name email').lean()
