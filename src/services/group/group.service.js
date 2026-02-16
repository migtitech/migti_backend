import GroupModel from '../../models/group.model.js'
import CategoryModel from '../../models/category.model.js'
import CustomError from '../../utils/exception.js'
import { statusCodes, errorCodes } from '../../core/common/constant.js'

const generateGroupCode = async () => {
  const groups = await GroupModel.find(
    { isDeleted: false, code: { $exists: true, $ne: '' } },
    { code: 1 },
  )
    .lean()
  const nums = groups
    .map((g) => {
      const m = g.code?.match(/^GRP(\d+)$/i)
      return m ? parseInt(m[1], 10) : 0
    })
    .filter((n) => n > 0)
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1
  return `GRP${String(next).padStart(2, '0')}`
}

export const addGroup = async (data) => {
  const existing = await GroupModel.findOne({
    name: { $regex: new RegExp(`^${data.name.trim()}$`, 'i') },
    isDeleted: false,
  }).lean()

  if (existing) {
    throw new CustomError(
      statusCodes.conflict,
      'Group with this name already exists',
      errorCodes.already_exist,
    )
  }

  const code = await generateGroupCode()
  const { code: _omit, ...rest } = data
  const group = await GroupModel.create({ ...rest, code })
  return group.toObject()
}

export const listGroups = async ({
  pageNumber = 1,
  pageSize = 10,
  search = '',
  status,
}) => {
  const page = Math.max(1, parseInt(pageNumber))
  const limit = Math.min(100, Math.max(1, parseInt(pageSize)))
  const skip = (page - 1) * limit

  const filter = { isDeleted: false }

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ]
  }

  if (status) {
    filter.status = status
  }

  const totalItems = await GroupModel.countDocuments(filter)

  const groups = await GroupModel.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()

  const totalPages = Math.ceil(totalItems / limit)

  return {
    groups,
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

export const getGroupById = async ({ groupId }) => {
  const group = await GroupModel.findById(groupId).lean()

  if (!group) {
    throw new CustomError(
      statusCodes.notFound,
      'Group not found',
      errorCodes.not_found,
    )
  }

  return group
}

export const updateGroup = async ({ groupId, ...updateData }) => {
  const group = await GroupModel.findById(groupId).lean()
  if (!group) {
    throw new CustomError(
      statusCodes.notFound,
      'Group not found',
      errorCodes.not_found,
    )
  }

  // Code is server-generated; do not allow client to override it
  const { code: _omit, ...rest } = updateData
  const updated = await GroupModel.findByIdAndUpdate(groupId, rest, {
    new: true,
    runValidators: true,
  }).lean()

  return updated
}

export const deleteGroup = async ({ groupId }) => {
  const group = await GroupModel.findById(groupId).lean()
  if (!group) {
    throw new CustomError(
      statusCodes.notFound,
      'Group not found',
      errorCodes.not_found,
    )
  }

  const categoryCount = await CategoryModel.countDocuments({
    group: groupId,
    isDeleted: false,
  })
  if (categoryCount > 0) {
    throw new CustomError(
      statusCodes.conflict,
      'Cannot delete group with associated categories.',
      errorCodes.conflict,
    )
  }

  await GroupModel.findByIdAndDelete(groupId)

  return {
    deletedGroup: {
      id: group._id,
      name: group.name,
      deletedAt: new Date().toISOString(),
    },
  }
}
