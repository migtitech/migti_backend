import {
  findAdminByEmail,
  findAdminByEmailExists,
  createAdmin,
  countAdmins,
  findAdmins,
  findAdminById,
  findAdminByIdRaw,
  updateAdminById,
  deleteAdminById,
} from '../../repository/admin.repository.js'
import { findSuperAdminByEmail } from '../../repository/superAdmin.repository.js'
import { Message, statusCodes, errorCodes } from '../../core/common/constant.js'
import CustomError from '../../utils/exception.js'
import { decrypt, encrypt } from '../../core/crypto/helper.cryto.js'
import { createTokenPair } from '../../core/helpers/jwt.helper.js'

export const adminLogin = async ({ email, password }) => {
  const admin = await findAdminByEmail(email)
  if (!admin) {
    throw new CustomError(
      statusCodes.notFound,
      Message.notFound,
      errorCodes.not_found
    )
  }
  const decryptedPassword = decrypt(admin.password)
  if (password !== decryptedPassword) {
    throw new CustomError(
      statusCodes.unauthorized,
      Message.wrongPassword,
      errorCodes.unauthorized
    )
  }

  const tokenPayload = {
    id: admin._id,
    email: admin.email,
    role: 'admin',
    type: 'access',
    access: admin.access,
  }

  const tokens = createTokenPair(tokenPayload)

  return {
    admin: {
      ...admin,
      access: admin.access,
    },
    ...tokens,
  }
}

export const superAdminLogin = async ({ email, password }) => {
  const superAdmin = await findSuperAdminByEmail(email)

  if (!superAdmin) {
    throw new CustomError(
      statusCodes.notFound,
      Message.notFound,
      errorCodes.not_found
    )
  }

  const decryptedPassword = decrypt(superAdmin.password)
  if (password !== decryptedPassword) {
    throw new CustomError(
      statusCodes.unauthorized,
      Message.wrongPassword,
      errorCodes.unauthorized
    )
  }

  const tokenPayload = {
    id: superAdmin._id,
    email: superAdmin.email,
    role: 'superadmin',
    type: 'access',
  }

  const tokens = createTokenPair(tokenPayload)

  return {
    superAdmin: {
      ...superAdmin,
    },
    ...tokens,
  }
}

export const addAdmin = async (adminData) => {
  let { name, email, password } = adminData
  const existingAdmin = await findAdminByEmailExists(email)
  if (existingAdmin) {
    throw new CustomError(
      statusCodes.conflict,
      Message.alreadyExist,
      errorCodes.already_exist
    )
  }
  adminData.password = encrypt(password)
  adminData.access = ['admin']
  const adminDoc = await createAdmin(adminData)
  const admin = adminDoc.toObject()
  return admin
}

export const listAdmins = async ({ pageNumber = 1, pageSize = 10 }) => {
  const page = Math.max(1, parseInt(pageNumber))
  const limit = Math.min(100, Math.max(1, parseInt(pageSize)))
  const skip = (page - 1) * limit

  const totalItems = await countAdmins()

  const admins = await findAdmins({ skip, limit })

  const totalPages = Math.ceil(totalItems / limit)
  const hasNextPage = page < totalPages
  const hasPrevPage = page > 1

  return {
    admins,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems,
      itemsPerPage: limit,
      hasNextPage,
      hasPrevPage,
    },
  }
}

export const updateAdmin = async ({ adminId, ...updateData }) => {
  const admin = await findAdminByIdRaw(adminId)
  if (!admin) {
    throw new CustomError(
      statusCodes.notFound,
      'Admin not found',
      errorCodes.not_found
    )
  }

  if (updateData.password) {
    updateData.password = encrypt(updateData.password)
  }

  const updatedAdmin = await updateAdminById(adminId, updateData)

  return updatedAdmin
}

export const deleteAdmin = async ({ adminId }) => {
  const admin = await findAdminByIdRaw(adminId)
  if (!admin) {
    throw new CustomError(
      statusCodes.notFound,
      'Admin not found',
      errorCodes.not_found
    )
  }

  await deleteAdminById(adminId)

  return {
    deletedAdmin: {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      uniqueId: admin.uniqueId,
      deletedAt: new Date().toISOString(),
    },
  }
}

export const updateAdminAccess = async ({ adminId, access }) => {
  const admin = await findAdminByIdRaw(adminId)
  if (!admin) {
    throw new CustomError(
      statusCodes.notFound,
      'Admin not found',
      errorCodes.not_found
    )
  }

  const updatedAdmin = await updateAdminById(adminId, { access })

  return updatedAdmin
}

export const getAdminById = async ({ adminId }) => {
  const admin = await findAdminById(adminId)

  if (!admin) {
    throw new CustomError(
      statusCodes.notFound,
      'Admin not found',
      errorCodes.not_found
    )
  }

  return admin
}
