import IndustryBranchModel from '../../models/industryBranch.model.js'
import CustomError from '../../utils/exception.js'
import { statusCodes, errorCodes } from '../../core/common/constant.js'

export const addIndustryBranch = async ({ industryId, name, location, address, gst }) => {
  const branchDoc = await IndustryBranchModel.create({
    industryId,
    name: name || '',
    location: location || '',
    address: address || '',
    gst: gst || '',
  })
  const result = await IndustryBranchModel.findById(branchDoc._id)
    .populate('industryId', 'name location address gstNumber')
    .lean()
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

  const totalItems = await IndustryBranchModel.countDocuments(filter)

  const branches = await IndustryBranchModel.find(filter)
    .populate('industryId', 'name location address gstNumber')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()

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
  const branch = await IndustryBranchModel.findOne({
    _id: industryBranchId,
    isDeleted: false,
  })
    .populate('industryId', 'name location address gstNumber')
    .lean()

  if (!branch) {
    throw new CustomError(
      statusCodes.notFound,
      'Industry branch not found',
      errorCodes.not_found,
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
  const branch = await IndustryBranchModel.findOne({
    _id: industryBranchId,
    isDeleted: false,
  }).lean()

  if (!branch) {
    throw new CustomError(
      statusCodes.notFound,
      'Industry branch not found',
      errorCodes.not_found,
    )
  }

  const updateData = {}
  if (industryId !== undefined) updateData.industryId = industryId
  if (name !== undefined) updateData.name = name
  if (location !== undefined) updateData.location = location
  if (address !== undefined) updateData.address = address
  if (gst !== undefined) updateData.gst = gst || ''

  const updated = await IndustryBranchModel.findByIdAndUpdate(
    industryBranchId,
    updateData,
    { new: true, runValidators: true },
  )
    .populate('industryId', 'name location address gstNumber')
    .lean()

  return updated
}

export const deleteIndustryBranch = async ({ industryBranchId }) => {
  const branch = await IndustryBranchModel.findOne({
    _id: industryBranchId,
    isDeleted: false,
  }).lean()

  if (!branch) {
    throw new CustomError(
      statusCodes.notFound,
      'Industry branch not found',
      errorCodes.not_found,
    )
  }

  await IndustryBranchModel.findByIdAndUpdate(
    industryBranchId,
    { $set: { isDeleted: true } },
    { new: true },
  )

  return {
    deletedIndustryBranch: {
      id: branch._id,
      name: branch.name,
      deletedAt: new Date().toISOString(),
    },
  }
}
