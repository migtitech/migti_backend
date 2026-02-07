import AreaModel from '../../models/area.model.js'
import CompanyBranchModel from '../../models/companyBranch.model.js'
import CustomError from '../../utils/exception.js'
import { statusCodes, errorCodes } from '../../core/common/constant.js'

export const addArea = async (data) => {
  const companyId = data.companyId
  const branchId = data.branchId

  const branch = await CompanyBranchModel.findOne({ _id: branchId, companyId }).lean()
  if (!branch) {
    throw new CustomError(
      statusCodes.badRequest,
      'Branch does not belong to the selected company',
      errorCodes.not_found,
    )
  }

  const existing = await AreaModel.findOne({
    companyId,
    branchId,
    name: data.name,
    isDeleted: false,
  }).lean()

  if (existing) {
    throw new CustomError(
      statusCodes.conflict,
      'Area with this name already exists for this branch',
      errorCodes.already_exist,
    )
  }

  const area = await AreaModel.create(data)
  return area.toObject()
}

export const listAreas = async ({
  pageNumber = 1,
  pageSize = 10,
  search = '',
  companyId,
  branchId,
  areaType,
}) => {
  const page = Math.max(1, parseInt(pageNumber))
  const limit = Math.min(100, Math.max(1, parseInt(pageSize)))
  const skip = (page - 1) * limit

  const filter = { isDeleted: false }

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { city: { $regex: search, $options: 'i' } },
    ]
  }

  if (companyId) {
    filter.companyId = companyId
  }

  if (branchId) {
    filter.branchId = branchId
  }

  if (areaType) {
    filter.areaType = areaType
  }

  const totalItems = await AreaModel.countDocuments(filter)

  const areas = await AreaModel.find(filter)
    .populate('companyId', 'name')
    .populate('branchId', 'name location')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()

  const totalPages = Math.ceil(totalItems / limit)

  return {
    areas,
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

export const getAreaById = async ({ areaId }) => {
  const area = await AreaModel.findById(areaId)
    .populate('companyId', 'name email')
    .populate('branchId', 'name location branchcode')
    .lean()

  if (!area) {
    throw new CustomError(
      statusCodes.notFound,
      'Area not found',
      errorCodes.not_found,
    )
  }

  return area
}

export const updateArea = async ({ areaId, ...updateData }) => {
  const area = await AreaModel.findById(areaId).lean()

  if (!area) {
    throw new CustomError(
      statusCodes.notFound,
      'Area not found',
      errorCodes.not_found,
    )
  }

  const updated = await AreaModel.findByIdAndUpdate(areaId, updateData, {
    new: true,
    runValidators: true,
  })
    .populate('companyId', 'name')
    .populate('branchId', 'name location')
    .lean()

  return updated
}

export const deleteArea = async ({ areaId }) => {
  const area = await AreaModel.findById(areaId).lean()

  if (!area) {
    throw new CustomError(
      statusCodes.notFound,
      'Area not found',
      errorCodes.not_found,
    )
  }

  await AreaModel.findByIdAndDelete(areaId)

  return {
    deletedArea: {
      id: area._id,
      name: area.name,
      deletedAt: new Date().toISOString(),
    },
  }
}
