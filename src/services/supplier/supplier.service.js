import SupplierModel from '../../models/supplier.model.js'
import CategoryModel from '../../models/category.model.js'
import CustomError from '../../utils/exception.js'
import { statusCodes, errorCodes } from '../../core/common/constant.js'

const normalizeCategories = (categories = []) => {
  if (!Array.isArray(categories)) return []
  return [...new Set(categories.filter(Boolean))]
}

const buildSupplierSearchFilter = (search = '') => {
  const filter = { isDeleted: false }
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { shopname: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone_1: { $regex: search, $options: 'i' } },
      { phone_2: { $regex: search, $options: 'i' } },
      { other_contact: { $regex: search, $options: 'i' } },
      { label: { $regex: search, $options: 'i' } },
    ]
  }
  return filter
}

const ensureCategoriesExist = async (categoryIds) => {
  if (categoryIds.length === 0) return
  const count = await CategoryModel.countDocuments({ _id: { $in: categoryIds } })
  if (count !== categoryIds.length) {
    throw new CustomError(
      statusCodes.badRequest,
      'One or more categories are invalid',
      errorCodes.invalid_input,
    )
  }
}

export const addSupplier = async (data) => {
  const categories = normalizeCategories(data.categories)
  await ensureCategoriesExist(categories)

  const supplier = await SupplierModel.create({
    ...data,
    categories,
    label: data.label || data.labal || '',
  })

  return supplier.toObject()
}

export const listSuppliers = async ({
  pageNumber = 1,
  pageSize = 10,
  search = '',
  category,
  subcategory,
  area,
}) => {
  const page = Math.max(1, parseInt(pageNumber))
  const limit = Math.min(100, Math.max(1, parseInt(pageSize)))
  const skip = (page - 1) * limit

  const filter = buildSupplierSearchFilter(search)

  if (subcategory) {
    filter.categories = subcategory
  } else if (category) {
    filter.categories = category
  }

  if (area) {
    const areaCondition = {
      $or: [
        { shop_location: { $regex: area, $options: 'i' } },
        { address: { $regex: area, $options: 'i' } },
      ],
    }
    if (filter.$or) {
      filter.$and = [{ $or: filter.$or }, areaCondition]
      delete filter.$or
    } else {
      Object.assign(filter, areaCondition)
    }
  }

  const totalItems = await SupplierModel.countDocuments(filter)

  const suppliers = await SupplierModel.find(filter)
    .populate('categories', 'name slug')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()

  const totalPages = Math.ceil(totalItems / limit)

  return {
    suppliers,
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

export const searchSuppliers = async ({ search = '', limit = 5 }) => {
  const take = Math.min(20, Math.max(1, parseInt(limit)))
  const filter = buildSupplierSearchFilter(search)
  const sort = search ? { name: 1 } : { createdAt: -1 }

  const suppliers = await SupplierModel.find(filter)
    .select('name shopname email phone_1 phone_2 other_contact label shop_location')
    .sort(sort)
    .limit(take)
    .lean()

  return { suppliers }
}

export const getSupplierById = async ({ supplierId }) => {
  const supplier = await SupplierModel.findById(supplierId)
    .populate('categories', 'name slug')
    .lean()

  if (!supplier) {
    throw new CustomError(
      statusCodes.notFound,
      'Supplier not found',
      errorCodes.not_found,
    )
  }

  return supplier
}

export const updateSupplier = async ({ supplierId, ...updateData }) => {
  const supplier = await SupplierModel.findById(supplierId).lean()
  if (!supplier) {
    throw new CustomError(
      statusCodes.notFound,
      'Supplier not found',
      errorCodes.not_found,
    )
  }

  if (updateData.categories) {
    updateData.categories = normalizeCategories(updateData.categories)
    await ensureCategoriesExist(updateData.categories)
  }

  if (updateData.labal && !updateData.label) {
    updateData.label = updateData.labal
  }
  delete updateData.labal

  const updated = await SupplierModel.findByIdAndUpdate(supplierId, updateData, {
    new: true,
    runValidators: true,
  })
    .populate('categories', 'name slug')
    .lean()

  return updated
}

export const deleteSupplier = async ({ supplierId }) => {
  const supplier = await SupplierModel.findById(supplierId).lean()
  if (!supplier) {
    throw new CustomError(
      statusCodes.notFound,
      'Supplier not found',
      errorCodes.not_found,
    )
  }

  await SupplierModel.findByIdAndDelete(supplierId)

  return {
    deletedSupplier: {
      id: supplier._id,
      name: supplier.name,
      deletedAt: new Date().toISOString(),
    },
  }
}
