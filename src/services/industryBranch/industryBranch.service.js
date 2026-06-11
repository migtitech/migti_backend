import {
  createIndustryBranch,
  findIndustryBranchByIdWithPopulate,
  countIndustryBranches,
  findIndustryBranchesWithPopulate,
  findOneIndustryBranchWithPopulate,
  findOneIndustryBranchLean,
  findIndustryBranchByIdAndUpdateWithPopulate,
  softDeleteIndustryBranchById,
} from '../../repository/industryBranch.repository.js'
import CustomError from '../../utils/exception.js'
import { statusCodes, errorCodes } from '../../core/common/constant.js'

export const addIndustryBranch = async ({
  industryId,
  name,
  location,
  address,
  gst,
}) => {
  const branchDoc = await createIndustryBranch({
    industryId,
    name: name || '',
    location: location || '',
    address: address || '',
    gst: gst || '',
  })
  const result = await findIndustryBranchByIdWithPopulate(branchDoc._id)
  return result
}

export const listIndustryBranches = async ({
  pageNumber = 1,
  pageSize = 10,
  industryId,
  search = '',
}) => {
  const page = Math.max(1, parseInt(pageNumber))
  const limit = Math.min(100, Math.max(1, parseInt(pageSize)))
  const skip = (page - 1) * limit

  const filter = { isDeleted: false }
  if (industryId) {
    filter.industryId = industryId
  }
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { location: { $regex: search, $options: 'i' } },
      { address: { $regex: search, $options: 'i' } },
      { gst: { $regex: search, $options: 'i' } },
    ]
  }

  const totalItems = await countIndustryBranches(filter)

  const branches = await findIndustryBranchesWithPopulate(filter, { skip, limit })

  const totalPages = Math.ceil(totalItems / limit)
  return {
    branches,
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

export const getIndustryBranchById = async ({ industryBranchId }) => {
  const branch = await findOneIndustryBranchWithPopulate({
    _id: industryBranchId,
    isDeleted: false,
  })

  if (!branch) {
    throw new CustomError(
      statusCodes.notFound,
      'Industry branch not found',
      errorCodes.not_found
    )
  }

  return branch
}

export const updateIndustryBranch = async ({
  industryBranchId,
  industryId,
  name,
  location,
  address,
  gst,
}) => {
  const branch = await findOneIndustryBranchLean({
    _id: industryBranchId,
    isDeleted: false,
  })

  if (!branch) {
    throw new CustomError(
      statusCodes.notFound,
      'Industry branch not found',
      errorCodes.not_found
    )
  }

  const updateData = {}
  if (industryId !== undefined) updateData.industryId = industryId
  if (name !== undefined) updateData.name = name
  if (location !== undefined) updateData.location = location
  if (address !== undefined) updateData.address = address
  if (gst !== undefined) updateData.gst = gst || ''

  const updated = await findIndustryBranchByIdAndUpdateWithPopulate(
    industryBranchId,
    updateData
  )

  return updated
}

export const deleteIndustryBranch = async ({ industryBranchId }) => {
  const branch = await findOneIndustryBranchLean({
    _id: industryBranchId,
    isDeleted: false,
  })

  if (!branch) {
    throw new CustomError(
      statusCodes.notFound,
      'Industry branch not found',
      errorCodes.not_found
    )
  }

  await softDeleteIndustryBranchById(industryBranchId)

  return {
    deletedIndustryBranch: {
      id: branch._id,
      name: branch.name,
      deletedAt: new Date().toISOString(),
    },
  }
}
