import IndustryModel from '../../models/industry.model.js'
import CustomError from '../../utils/exception.js'
import { statusCodes, errorCodes } from '../../core/common/constant.js'

export const addIndustry = async (data) => {
  const existing = await IndustryModel.findOne({
    name: data.name,
    isDeleted: false,
  }).lean()

  if (existing) {
    throw new CustomError(
      statusCodes.conflict,
      'Industry with this name already exists',
      errorCodes.already_exist,
    )
  }

  if (!data.area) {
    data.area = null
  }

  const industry = await IndustryModel.create(data)
  return industry.toObject()
}

export const listIndustries = async ({
  pageNumber = 1,
  pageSize = 10,
  search = '',
}) => {
  const page = Math.max(1, parseInt(pageNumber))
  const limit = Math.min(100, Math.max(1, parseInt(pageSize)))
  const skip = (page - 1) * limit

  const filter = { isDeleted: false }

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { location: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { purchase_manager_name: { $regex: search, $options: 'i' } },
    ]
  }

  const totalItems = await IndustryModel.countDocuments(filter)

  const industries = await IndustryModel.find(filter)
    .populate('area', 'name city areaType')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()

  const totalPages = Math.ceil(totalItems / limit)

  return {
    industries,
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

export const getIndustryById = async ({ industryId }) => {
  const industry = await IndustryModel.findById(industryId)
    .populate('area', 'name city areaType')
    .lean()

  if (!industry) {
    throw new CustomError(
      statusCodes.notFound,
      'Industry not found',
      errorCodes.not_found,
    )
  }

  return industry
}

export const updateIndustry = async ({ industryId, ...updateData }) => {
  const industry = await IndustryModel.findById(industryId).lean()
  if (!industry) {
    throw new CustomError(
      statusCodes.notFound,
      'Industry not found',
      errorCodes.not_found,
    )
  }

  if (updateData.area === '') {
    updateData.area = null
  }

  const updated = await IndustryModel.findByIdAndUpdate(industryId, updateData, {
    new: true,
    runValidators: true,
  })
    .populate('area', 'name city areaType')
    .lean()

  return updated
}

export const deleteIndustry = async ({ industryId }) => {
  const industry = await IndustryModel.findById(industryId).lean()
  if (!industry) {
    throw new CustomError(
      statusCodes.notFound,
      'Industry not found',
      errorCodes.not_found,
    )
  }

  await IndustryModel.findByIdAndDelete(industryId)

  return {
    deletedIndustry: {
      id: industry._id,
      name: industry.name,
      deletedAt: new Date().toISOString(),
    },
  }
}
