import RawQueryModel from '../../models/rawQuery.model.js'
import CustomError from '../../utils/exception.js'
import { statusCodes, errorCodes } from '../../core/common/constant.js'

export const addRawQuery = async ({
  priority,
  title,
  company_info,
  supplier_id,
  description,
  files = [],
  created_by,
}) => {
  const rawQueryDoc = await RawQueryModel.create({
    priority,
    title,
    company_info,
    supplier_id: supplier_id || null,
    description,
    files,
    created_by,
  })

  return rawQueryDoc.toObject()
}

export const listRawQueries = async ({
  pageNumber = 1,
  pageSize = 10,
  search = '',
}) => {
  const page = Math.max(1, parseInt(pageNumber))
  const limit = Math.min(100, Math.max(1, parseInt(pageSize)))
  const skip = (page - 1) * limit

  const filter = {}
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { company_info: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { priority: { $regex: search, $options: 'i' } },
    ]
  }

  const totalItems = await RawQueryModel.countDocuments(filter)

  const rawQueries = await RawQueryModel.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()

  const totalPages = Math.ceil(totalItems / limit)
  const hasNextPage = page < totalPages
  const hasPrevPage = page > 1

  return {
    rawQueries,
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

export const getRawQueryById = async ({ rawQueryId }) => {
  const rawQuery = await RawQueryModel.findById(rawQueryId)
    .populate('supplier_id')
    .lean()

  if (!rawQuery) {
    throw new CustomError(
      statusCodes.notFound,
      'Raw query not found',
      errorCodes.not_found
    )
  }

  return rawQuery
}

export const updateRawQuery = async ({ rawQueryId, ...updateData }) => {
  const rawQuery = await RawQueryModel.findById(rawQueryId).lean()
  if (!rawQuery) {
    throw new CustomError(
      statusCodes.notFound,
      'Raw query not found',
      errorCodes.not_found
    )
  }

  const updatedRawQuery = await RawQueryModel.findByIdAndUpdate(
    rawQueryId,
    updateData,
    {
      new: true,
      runValidators: true,
    }
  ).lean()

  return updatedRawQuery
}

export const deleteRawQuery = async ({ rawQueryId }) => {
  const rawQuery = await RawQueryModel.findById(rawQueryId).lean()
  if (!rawQuery) {
    throw new CustomError(
      statusCodes.notFound,
      'Raw query not found',
      errorCodes.not_found
    )
  }

  await RawQueryModel.findByIdAndDelete(rawQueryId)

  return {
    deletedRawQuery: {
      id: rawQuery._id,
      title: rawQuery.title,
      company_info: rawQuery.company_info,
      deletedAt: new Date().toISOString(),
    },
  }
}
