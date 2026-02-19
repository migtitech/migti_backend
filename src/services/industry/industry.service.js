import IndustryModel from '../../models/industry.model.js'
import IndustryPurchaseManagerModel from '../../models/industryPurchaseManager.model.js'
import IndustryBranchModel from '../../models/industryBranch.model.js'
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

  const { purchaseManagers = [], ...industryPayload } = data
  const industry = await IndustryModel.create(industryPayload)
  const industryId = industry._id

  if (purchaseManagers && purchaseManagers.length > 0) {
    await IndustryPurchaseManagerModel.insertMany(
      purchaseManagers.map((pm) => ({
        industryId,
        name: pm.name || '',
        phone: pm.phone || '',
        email: pm.email || '',
      })),
    )
  }

  const result = await IndustryModel.findById(industryId)
    .populate('area', 'name city areaType')
    .lean()
  const managers = await IndustryPurchaseManagerModel.find({
    industryId,
    isDeleted: false,
  }).lean()
  return { ...result, purchaseManagers: managers }
}

export const listIndustries = async ({
  pageNumber = 1,
  pageSize = 10,
  search = '',
}) => {
  const page = Math.max(1, parseInt(pageNumber))
  const limit = Math.min(1000, Math.max(1, parseInt(pageSize)))
  const skip = (page - 1) * limit

  const filter = { isDeleted: false }

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { location: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { purchase_manager_name: { $regex: search, $options: 'i' } },
      { gstNumber: { $regex: search, $options: 'i' } },
    ]
  }

  const totalItems = await IndustryModel.countDocuments(filter)

  const industries = await IndustryModel.find(filter)
    .populate('area', 'name city areaType')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()

  const industryIds = industries.map((i) => i._id)
  const allManagers = await IndustryPurchaseManagerModel.find({
    industryId: { $in: industryIds },
    isDeleted: false,
  }).lean()
  const managersByIndustry = allManagers.reduce((acc, m) => {
    const id = m.industryId?.toString?.() ?? m.industryId
    if (!acc[id]) acc[id] = []
    acc[id].push(m)
    return acc
  }, {})
  const industriesWithManagers = industries.map((ind) => ({
    ...ind,
    purchaseManagers: managersByIndustry[ind._id.toString()] || [],
  }))

  const totalPages = Math.ceil(totalItems / limit)

  return {
    industries: industriesWithManagers,
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

  const purchaseManagers = await IndustryPurchaseManagerModel.find({
    industryId,
    isDeleted: false,
  }).lean()
  return { ...industry, purchaseManagers }
}

const ALLOWED_UPDATE_FIELDS = ['location', 'address', 'purchase_manager_name', 'purchase_manager_phone']

export const updateIndustry = async ({ industryId, purchaseManagers, ...updateData }) => {
  const industry = await IndustryModel.findById(industryId).lean()
  if (!industry) {
    throw new CustomError(
      statusCodes.notFound,
      'Industry not found',
      errorCodes.not_found,
    )
  }

  const allowedUpdate = {}
  for (const key of ALLOWED_UPDATE_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(updateData, key)) {
      allowedUpdate[key] = updateData[key]
    }
  }

  if (Array.isArray(purchaseManagers)) {
    await IndustryPurchaseManagerModel.updateMany(
      { industryId, isDeleted: false },
      { $set: { isDeleted: true } },
    )
    if (purchaseManagers.length > 0) {
      await IndustryPurchaseManagerModel.insertMany(
        purchaseManagers.map((pm) => ({
          industryId,
          name: pm.name || '',
          phone: pm.phone || '',
          email: pm.email || '',
        })),
      )
    }
  }

  const updated = await IndustryModel.findByIdAndUpdate(industryId, allowedUpdate, {
    new: true,
    runValidators: true,
  })
    .populate('area', 'name city areaType')
    .lean()

  const managers = await IndustryPurchaseManagerModel.find({
    industryId,
    isDeleted: false,
  }).lean()
  return { ...updated, purchaseManagers: managers }
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

  await IndustryPurchaseManagerModel.updateMany(
    { industryId },
    { $set: { isDeleted: true } },
  )
  await IndustryBranchModel.updateMany(
    { industryId },
    { $set: { isDeleted: true } },
  )
  await IndustryModel.findByIdAndDelete(industryId)

  return {
    deletedIndustry: {
      id: industry._id,
      name: industry.name,
      deletedAt: new Date().toISOString(),
    },
  }
}
