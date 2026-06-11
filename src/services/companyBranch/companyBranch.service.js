import {
  findCompanyBranchByEmailOrCode,
  createCompanyBranch,
  countCompanyBranches,
  findCompanyBranches,
  findCompanyBranchById,
  findCompanyBranchByIdRaw,
  updateCompanyBranchById,
  deleteCompanyBranchById,
} from '../../repository/companyBranch.repository.js'
import CustomError from '../../utils/exception.js'
import { statusCodes, errorCodes } from '../../core/common/constant.js'

export const addCompanyBranch = async ({
  name,
  companyId,
  adminId,
  email,
  location,
  branchcode,
  phone,
  address,
  gstNumber,
  fullAddress,
  mapLocationUrl,
  signature,
}) => {
  const existingBranch = await findCompanyBranchByEmailOrCode({
    companyId,
    email,
    branchcode,
  })

  if (existingBranch) {
    throw new CustomError(
      statusCodes.conflict,
      'Company branch already exists',
      errorCodes.already_exist
    )
  }

  const branchDoc = await createCompanyBranch({
    name,
    companyId,
    ...(adminId ? { adminId } : {}),
    email,
    branchcode,
    phone,
    address,
    gstNumber,
    fullAddress,
    ...(mapLocationUrl ? { mapLocationUrl } : {}),
    ...(signature ? { signature } : {}),
  })

  return branchDoc.toObject()
}

export const listCompanyBranches = async ({
  pageNumber = 1,
  pageSize = 10,
  companyId,
}) => {
  const page = Math.max(1, parseInt(pageNumber))
  const limit = Math.min(100, Math.max(1, parseInt(pageSize)))
  const skip = (page - 1) * limit

  const filter = {}
  if (companyId) {
    filter.companyId = companyId
  }

  const totalItems = await countCompanyBranches(filter)

  const branches = await findCompanyBranches(filter, { skip, limit })

  const totalPages = Math.ceil(totalItems / limit)
  const hasNextPage = page < totalPages
  const hasPrevPage = page > 1

  return {
    branches,
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

export const getCompanyBranchById = async ({ companyBranchId }) => {
  const branch = await findCompanyBranchById(companyBranchId)

  if (!branch) {
    throw new CustomError(
      statusCodes.notFound,
      'Company branch not found',
      errorCodes.not_found
    )
  }

  return branch
}

export const updateCompanyBranch = async ({
  companyBranchId,
  ...updateData
}) => {
  const branch = await findCompanyBranchByIdRaw(companyBranchId)
  if (!branch) {
    throw new CustomError(
      statusCodes.notFound,
      'Company branch not found',
      errorCodes.not_found
    )
  }

  const updatedBranch = await updateCompanyBranchById(
    companyBranchId,
    updateData
  )

  return updatedBranch
}

export const deleteCompanyBranch = async ({ companyBranchId }) => {
  const branch = await findCompanyBranchByIdRaw(companyBranchId)
  if (!branch) {
    throw new CustomError(
      statusCodes.notFound,
      'Company branch not found',
      errorCodes.not_found
    )
  }

  await deleteCompanyBranchById(companyBranchId)

  return {
    deletedBranch: {
      id: branch._id,
      name: branch.name,
      email: branch.email,
      deletedAt: new Date().toISOString(),
    },
  }
}
