import {
  GroupModel,
  findOneGroupLean,
  createGroup,
  countGroups,
  findGroups,
  findGroupByIdLean,
  findGroupByIdAndUpdateLean,
  deleteGroupById,
} from '../../repository/group.repository.js'
import { countCategories } from '../../repository/category.repository.js'
import CustomError from '../../utils/exception.js'
import { statusCodes, errorCodes } from '../../core/common/constant.js'
import { generateUniqueCode } from '../codeSequence/codeSequence.service.js'

export const addGroup = async (data) => {
  const existing = await findOneGroupLean({
    name: { $regex: new RegExp(`^${data.name.trim()}$`, 'i') },
    isDeleted: false,
  })

  if (existing) {
    throw new CustomError(
      statusCodes.conflict,
      'Group with this name already exists',
      errorCodes.already_exist
    )
  }

  const code = await generateUniqueCode('groupCode', {
    model: GroupModel,
    field: 'code',
  })
  const { code: _omit, ...rest } = data
  const group = await createGroup({ ...rest, code })
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

  const totalItems = await countGroups(filter)

  const groups = await findGroups(filter, { skip, limit })

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
  const group = await findGroupByIdLean(groupId)

  if (!group) {
    throw new CustomError(
      statusCodes.notFound,
      'Group not found',
      errorCodes.not_found
    )
  }

  return group
}

export const updateGroup = async ({ groupId, ...updateData }) => {
  const group = await findGroupByIdLean(groupId)
  if (!group) {
    throw new CustomError(
      statusCodes.notFound,
      'Group not found',
      errorCodes.not_found
    )
  }

  // Code is server-generated; do not allow client to override it
  const { code: _omit, ...rest } = updateData
  const updated = await findGroupByIdAndUpdateLean(groupId, rest)

  return updated
}

export const deleteGroup = async ({ groupId }) => {
  const group = await findGroupByIdLean(groupId)
  if (!group) {
    throw new CustomError(
      statusCodes.notFound,
      'Group not found',
      errorCodes.not_found
    )
  }

  const categoryCount = await countCategories({
    group: groupId,
    isDeleted: false,
  })
  if (categoryCount > 0) {
    throw new CustomError(
      statusCodes.conflict,
      'Cannot delete group with associated categories.',
      errorCodes.conflict
    )
  }

  await deleteGroupById(groupId)

  return {
    deletedGroup: {
      id: group._id,
      name: group.name,
      deletedAt: new Date().toISOString(),
    },
  }
}
