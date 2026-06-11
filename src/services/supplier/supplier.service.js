import {
  createSupplier,
  countSuppliers,
  findSuppliersWithPopulate,
  findSuppliersSelectFields,
  findOneSupplierWithPopulate,
  findOneSupplierLean,
  findSupplierByIdAndUpdateWithPopulate,
  deleteSupplierById,
} from '../../repository/supplier.repository.js'
import { countCategories } from '../../repository/category.repository.js'
import CustomError from '../../utils/exception.js'
import { statusCodes, errorCodes } from '../../core/common/constant.js'
import { uploadToS3 } from '../../core/helpers/s3bucket.js'

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
      { gst: { $regex: search, $options: 'i' } },
    ]
  }
  return filter
}

const ensureCategoriesExist = async (categoryIds) => {
  if (categoryIds.length === 0) return
  const count = await countCategories({
    _id: { $in: categoryIds },
  })
  if (count !== categoryIds.length) {
    throw new CustomError(
      statusCodes.badRequest,
      'One or more categories are invalid',
      errorCodes.invalid_input
    )
  }
}

export const addSupplier = async (data) => {
  const categories = normalizeCategories(data.categories)
  await ensureCategoriesExist(categories)

  const { branchId, ...rest } = data
  const supplier = await createSupplier({
    ...rest,
    categories,
    label: data.label || data.labal || '',
    gst: (data.gst || '').trim().toUpperCase(),
    branchId: branchId || null,
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
  branchFilter = {},
}) => {
  const page = Math.max(1, parseInt(pageNumber))
  const limit = Math.min(100, Math.max(1, parseInt(pageSize)))
  const skip = (page - 1) * limit

  const filter = { ...buildSupplierSearchFilter(search), ...branchFilter }

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

  const totalItems = await countSuppliers(filter)

  const suppliers = await findSuppliersWithPopulate(filter, { skip, limit })

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

export const searchSuppliers = async ({
  search = '',
  limit = 5,
  branchFilter = {},
}) => {
  const take = Math.min(20, Math.max(1, parseInt(limit)))
  const filter = { ...buildSupplierSearchFilter(search), ...branchFilter }
  const sort = search ? { name: 1 } : { createdAt: -1 }

  const suppliers = await findSuppliersSelectFields(filter, { sort, limit: take })

  return { suppliers }
}

export const getSupplierById = async ({ supplierId, branchFilter = {} }) => {
  const supplier = await findOneSupplierWithPopulate({
    _id: supplierId,
    isDeleted: false,
    ...branchFilter,
  })

  if (!supplier) {
    throw new CustomError(
      statusCodes.notFound,
      'Supplier not found',
      errorCodes.not_found
    )
  }

  return supplier
}

const ALLOWED_UPDATE_FIELDS = [
  'address',
  'shippingAddress',
  'billingAddress',
  'phone_1',
  'phone_2',
  'categories',
  'remark',
]

export const uploadSupplierCatalog = async (
  { supplierId, branchFilter = {} },
  file
) => {
  const supplier = await findOneSupplierLean({
    _id: supplierId,
    isDeleted: false,
    ...branchFilter,
  })
  if (!supplier) {
    throw new CustomError(
      statusCodes.notFound,
      'Supplier not found',
      errorCodes.not_found
    )
  }

  if (!file?.buffer) {
    throw new CustomError(
      statusCodes.badRequest,
      'Catalog file is required',
      errorCodes.invalid_input
    )
  }

  const folder = `supplier-catalogs/${supplierId}`
  const result = await uploadToS3(file, process.env.AWS_BUCKET_NAME, folder)

  if (!result.success || !result.data?.url) {
    throw new CustomError(
      statusCodes.badRequest,
      result.message || 'Catalog upload failed',
      errorCodes.invalid_input
    )
  }

  const uploadedAt = new Date()
  const catalog = {
    url: result.data.url,
    fileName: result.data.originalName || result.data.fileName,
    uploadedAt,
  }

  const updated = await findSupplierByIdAndUpdateWithPopulate(supplierId, {
    catalog,
  })

  return updated
}

export const updateSupplier = async ({
  supplierId,
  branchFilter = {},
  ...updateData
}) => {
  const supplier = await findOneSupplierLean({
    _id: supplierId,
    isDeleted: false,
    ...branchFilter,
  })
  if (!supplier) {
    throw new CustomError(
      statusCodes.notFound,
      'Supplier not found',
      errorCodes.not_found
    )
  }

  const allowedUpdate = {}
  for (const key of ALLOWED_UPDATE_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(updateData, key)) {
      allowedUpdate[key] = updateData[key]
    }
  }

  if (allowedUpdate.categories) {
    allowedUpdate.categories = normalizeCategories(allowedUpdate.categories)
    await ensureCategoriesExist(allowedUpdate.categories)
  }

  const updated = await findSupplierByIdAndUpdateWithPopulate(
    supplierId,
    allowedUpdate
  )

  return updated
}

export const deleteSupplier = async ({ supplierId, branchFilter = {} }) => {
  const supplier = await findOneSupplierLean({
    _id: supplierId,
    isDeleted: false,
    ...branchFilter,
  })
  if (!supplier) {
    throw new CustomError(
      statusCodes.notFound,
      'Supplier not found',
      errorCodes.not_found
    )
  }

  await deleteSupplierById(supplierId)

  return {
    deletedSupplier: {
      id: supplier._id,
      name: supplier.name,
      deletedAt: new Date().toISOString(),
    },
  }
}
