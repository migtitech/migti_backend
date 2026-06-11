import {
  findBrandBySlug,
  findBrandBySlugExcludingId,
  findActiveBrandByName,
  createBrand,
  countBrands,
  findBrands,
  findBrandById,
  updateBrandById,
  deleteBrandById,
} from '../../repository/brand.repository.js'
import { countProductsByBrand } from '../../repository/product.repository.js'
import CustomError from '../../utils/exception.js'
import { statusCodes, errorCodes } from '../../core/common/constant.js'
import { generateSlug, generateUniqueSlug } from '../../utils/slugGenerator.js'

export const addBrand = async (data) => {
  const baseSlug = generateSlug(data.name)
  const slug = await generateUniqueSlug(baseSlug, async (s) => {
    return await findBrandBySlug(s)
  })

  const existing = await findActiveBrandByName(data.name)
  if (existing) {
    throw new CustomError(
      statusCodes.conflict,
      'Brand already exists',
      errorCodes.already_exist
    )
  }

  const brand = await createBrand({ ...data, slug })
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

  const totalItems = await countBrands(filter)

  const brands = await findBrands(filter, { skip, limit })

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
  const brand = await findBrandById(brandId)

  if (!brand) {
    throw new CustomError(
      statusCodes.notFound,
      'Brand not found',
      errorCodes.not_found
    )
  }

  return brand
}

export const updateBrand = async ({ brandId, ...updateData }) => {
  const brand = await findBrandById(brandId)
  if (!brand) {
    throw new CustomError(
      statusCodes.notFound,
      'Brand not found',
      errorCodes.not_found
    )
  }

  if (updateData.name && updateData.name !== brand.name) {
    const baseSlug = generateSlug(updateData.name)
    updateData.slug = await generateUniqueSlug(baseSlug, async (s) => {
      return await findBrandBySlugExcludingId(s, brandId)
    })
  }

  const updated = await updateBrandById(brandId, updateData)

  return updated
}

export const deleteBrand = async ({ brandId }) => {
  const brand = await findBrandById(brandId)
  if (!brand) {
    throw new CustomError(
      statusCodes.notFound,
      'Brand not found',
      errorCodes.not_found
    )
  }

  const productCount = await countProductsByBrand(brandId)
  if (productCount > 0) {
    throw new CustomError(
      statusCodes.conflict,
      'Cannot delete brand with associated products.',
      errorCodes.conflict
    )
  }

  await deleteBrandById(brandId)

  return {
    deletedBrand: {
      id: brand._id,
      name: brand.name,
      deletedAt: new Date().toISOString(),
    },
  }
}
