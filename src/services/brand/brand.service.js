import BrandModel from '../../models/brand.model.js'
import ProductModel from '../../models/product.model.js'
import CustomError from '../../utils/exception.js'
import { statusCodes, errorCodes } from '../../core/common/constant.js'
import { generateSlug, generateUniqueSlug } from '../../utils/slugGenerator.js'

export const addBrand = async (data) => {
  const baseSlug = generateSlug(data.name)
  const slug = await generateUniqueSlug(baseSlug, async (s) => {
    return await BrandModel.findOne({ slug: s })
  })

  const existing = await BrandModel.findOne({
    name: data.name,
    isDeleted: false,
  }).lean()
  if (existing) {
    throw new CustomError(
      statusCodes.conflict,
      'Brand already exists',
      errorCodes.already_exist,
    )
  }

  const brand = await BrandModel.create({ ...data, slug })
  return brand.toObject()
}

export const listBrands = async ({
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
      { description: { $regex: search, $options: 'i' } },
    ]
  }

  if (status) {
    filter.status = status
  }

  const totalItems = await BrandModel.countDocuments(filter)

  const brands = await BrandModel.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()

  const totalPages = Math.ceil(totalItems / limit)

  return {
    brands,
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

export const getBrandById = async ({ brandId }) => {
  const brand = await BrandModel.findById(brandId).lean()

  if (!brand) {
    throw new CustomError(
      statusCodes.notFound,
      'Brand not found',
      errorCodes.not_found,
    )
  }

  return brand
}

export const updateBrand = async ({ brandId, ...updateData }) => {
  const brand = await BrandModel.findById(brandId).lean()
  if (!brand) {
    throw new CustomError(
      statusCodes.notFound,
      'Brand not found',
      errorCodes.not_found,
    )
  }

  if (updateData.name && updateData.name !== brand.name) {
    const baseSlug = generateSlug(updateData.name)
    updateData.slug = await generateUniqueSlug(baseSlug, async (s) => {
      return await BrandModel.findOne({ slug: s, _id: { $ne: brandId } })
    })
  }

  const updated = await BrandModel.findByIdAndUpdate(brandId, updateData, {
    new: true,
    runValidators: true,
  }).lean()

  return updated
}

export const deleteBrand = async ({ brandId }) => {
  const brand = await BrandModel.findById(brandId).lean()
  if (!brand) {
    throw new CustomError(
      statusCodes.notFound,
      'Brand not found',
      errorCodes.not_found,
    )
  }

  const productCount = await ProductModel.countDocuments({
    brand: brandId,
    isDeleted: false,
  })
  if (productCount > 0) {
    throw new CustomError(
      statusCodes.conflict,
      'Cannot delete brand with associated products.',
      errorCodes.conflict,
    )
  }

  await BrandModel.findByIdAndDelete(brandId)

  return {
    deletedBrand: {
      id: brand._id,
      name: brand.name,
      deletedAt: new Date().toISOString(),
    },
  }
}
