import {
  findOneAreaLean,
  createArea,
  countAreas,
  findAreasWithPopulate,
  findAreaByIdWithDetailPopulate,
  findAreaByIdAndUpdateWithPopulate,
  deleteAreaById,
} from '../../repository/area.repository.js'
import { findOneCompanyBranchLean } from '../../repository/companyBranch.repository.js'
import CustomError from '../../utils/exception.js'
import { statusCodes, errorCodes } from '../../core/common/constant.js'

export const addArea = async (data) => {
  const companyId = data.companyId
  const branchId = data.branchId

  const branch = await findOneCompanyBranchLean({
    _id: branchId,
    companyId,
  })
  if (!branch) {
    throw new CustomError(
      statusCodes.badRequest,
      'Branch does not belong to the selected company',
      errorCodes.not_found
    )
  }

  const existing = await findOneAreaLean({
    companyId,
    branchId,
    name: data.name,
    isDeleted: false,
  })

  if (existing) {
    throw new CustomError(
      statusCodes.conflict,
      'Area with this name already exists for this branch',
      errorCodes.already_exist
    )
  }

  const area = await createArea(data)
  return area.toObject()
}

export const listAreas = async ({
  pageNumber = 1,
  pageSize = 10,
  search = '',
  companyId,
  branchId,
  areaType,
  branchFilter = {},
}) => {
  const page = Math.max(1, parseInt(pageNumber))
  const limit = Math.min(100, Math.max(1, parseInt(pageSize)))
  const skip = (page - 1) * limit

  const filter = { isDeleted: false, ...branchFilter }

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { city: { $regex: search, $options: 'i' } },
    ]
  }

  if (companyId) {
    filter.companyId = companyId
  }

  if (branchId && !filter.branchId) {
    filter.branchId = branchId
  }

  if (areaType) {
    filter.areaType = areaType
  }

  const totalItems = await countAreas(filter)

  const areas = await findAreasWithPopulate(filter, { skip, limit })

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

export const getAreaById = async ({ areaId, branchFilter = {} }) => {
  const area = await findAreaByIdWithDetailPopulate({ _id: areaId, ...branchFilter })

  if (!area) {
    throw new CustomError(
      statusCodes.notFound,
      'Area not found',
      errorCodes.not_found
    )
  }

  return area
}

export const updateArea = async ({
  areaId,
  branchFilter = {},
  ...updateData
}) => {
  const area = await findOneAreaLean({ _id: areaId, ...branchFilter })

  if (!area) {
    throw new CustomError(
      statusCodes.notFound,
      'Area not found',
      errorCodes.not_found
    )
  }

  const updated = await findAreaByIdAndUpdateWithPopulate(areaId, updateData)

  return updated
}

export const deleteArea = async ({ areaId, branchFilter = {} }) => {
  const area = await findOneAreaLean({ _id: areaId, ...branchFilter })

  if (!area) {
    throw new CustomError(
      statusCodes.notFound,
      'Area not found',
      errorCodes.not_found
    )
  }

  await deleteAreaById(areaId)

  return {
    deletedArea: {
      id: area._id,
      name: area.name,
      deletedAt: new Date().toISOString(),
    },
  }
}
