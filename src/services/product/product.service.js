import {
  ProductModel,
  findOneProduct,
  findOneProductLean,
  findProductByIdLean,
  createProduct,
  countProducts,
  findProductsWithListPopulate,
  findProductByIdWithDetailPopulate,
  findProductByIdAndUpdateWithPopulate,
  deleteProductById,
} from '../../repository/product.repository.js'
import {
  findCategoryByIdLean,
} from '../../repository/category.repository.js'
import { findBrandByIdLean } from '../../repository/brand.repository.js'
import { findOneIndustryLean } from '../../repository/industry.repository.js'
import CustomError from '../../utils/exception.js'
import { statusCodes, errorCodes } from '../../core/common/constant.js'
import { generateSlug, generateUniqueSlug } from '../../utils/slugGenerator.js'
import { generateUniqueCode } from '../codeSequence/codeSequence.service.js'

const normalizeCompanyProductCodes = async (codes = []) => {
  const filtered = (codes || []).filter(
    (item) => item?.industry && String(item.code || '').trim()
  )
  if (filtered.length === 0) return []

  const industryIds = filtered.map((item) => String(item.industry))
  if (new Set(industryIds).size !== industryIds.length) {
    throw new CustomError(
      statusCodes.badRequest,
      'Duplicate company selected in company product codes',
      errorCodes.invalid_input
    )
  }

  for (const item of filtered) {
    const industry = await findOneIndustryLean({
      _id: item.industry,
      isDeleted: false,
    })
    if (!industry) {
      throw new CustomError(
        statusCodes.notFound,
        'Company (client) not found',
        errorCodes.not_found
      )
    }
  }

  return filtered.map((item) => ({
    industry: item.industry,
    code: String(item.code).trim(),
  }))
}

export const addProduct = async (data) => {
  const baseSlug = generateSlug(data.name)
  const slug = await generateUniqueSlug(baseSlug, async (s) => {
    return await findOneProduct({ slug: s })
  })

  const existingSku = await findOneProductLean({ sku: data.sku })
  if (existingSku) {
    throw new CustomError(
      statusCodes.conflict,
      'Product with this SKU already exists',
      errorCodes.already_exist
    )
  }

  const category = await findCategoryByIdLean(data.category)
  if (!category) {
    throw new CustomError(
      statusCodes.notFound,
      'Category not found',
      errorCodes.not_found
    )
  }

  if (data.subcategory) {
    const subcategory = await findCategoryByIdLean(data.subcategory)
    if (!subcategory || String(subcategory.parent) !== String(data.category)) {
      throw new CustomError(
        statusCodes.badRequest,
        'Invalid subcategory for the selected category',
        errorCodes.invalid_input
      )
    }
  }

  if (data.brand) {
    const brand = await findBrandByIdLean(data.brand)
    if (!brand) {
      throw new CustomError(
        statusCodes.notFound,
        'Brand not found',
        errorCodes.not_found
      )
    }
  }

  const productCode = await generateUniqueCode('productCode', {
    model: ProductModel,
    field: 'productCode',
  })

  const variantCombinationsWithCode = (data.variantCombinations || []).map(
    (vc, i) => ({
      ...vc,
      variantCode: `${productCode}v${i + 1}`,
    })
  )

  const companyProductCodes = await normalizeCompanyProductCodes(
    data.companyProductCodes
  )

  const product = await createProduct({
    ...data,
    slug,
    productCode,
    variantCombinations: variantCombinationsWithCode,
    subcategory: data.subcategory || null,
    brand: data.brand || null,
    companyProductCodes,
  })

  return product.toObject()
}

export const listProducts = async ({
  pageNumber = 1,
  pageSize = 10,
  search = '',
  category,
  subcategory,
  brand,
  status,
  hsnNumber,
  modelNumber,
  sortBy = 'createdAt',
  sortOrder = 'desc',
}) => {
  const page = Math.max(1, parseInt(pageNumber))
  const limit = Math.min(100, Math.max(1, parseInt(pageSize)))
  const skip = (page - 1) * limit

  const filter = { isDeleted: false }

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { sku: { $regex: search, $options: 'i' } },
      { productCode: { $regex: search, $options: 'i' } },
      { 'variantCombinations.variantCode': { $regex: search, $options: 'i' } },
      { tags: { $regex: search, $options: 'i' } },
    ]
  }

  if (hsnNumber && hsnNumber.trim()) {
    const hsnTerm = hsnNumber.trim()
    filter.$and = filter.$and || []
    filter.$and.push({
      $or: [
        { hsnNumber: { $regex: hsnTerm, $options: 'i' } },
        { 'variantCombinations.hsnNumber': { $regex: hsnTerm, $options: 'i' } },
      ],
    })
  }

  if (modelNumber && modelNumber.trim()) {
    const modelTerm = modelNumber.trim()
    filter.$and = filter.$and || []
    filter.$and.push({
      $or: [
        { defaultModelNumber: { $regex: modelTerm, $options: 'i' } },
        {
          'variantCombinations.modelNumber': {
            $regex: modelTerm,
            $options: 'i',
          },
        },
      ],
    })
  }

  if (category) filter.category = category
  if (subcategory) filter.subcategory = subcategory
  if (brand) filter.brand = brand
  if (status) filter.status = status

  const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 }

  const [totalItems, products] = await Promise.all([
    countProducts(filter),
    findProductsWithListPopulate(filter, { sort, skip, limit }),
  ])

  const totalPages = Math.ceil(totalItems / limit)

  return {
    products,
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

export const getProductById = async ({ productId }) => {
  const product = await findProductByIdWithDetailPopulate(productId)

  if (!product) {
    throw new CustomError(
      statusCodes.notFound,
      'Product not found',
      errorCodes.not_found
    )
  }

  return product
}

export const updateProduct = async ({ productId, ...updateData }) => {
  const product = await findProductByIdLean(productId)
  if (!product) {
    throw new CustomError(
      statusCodes.notFound,
      'Product not found',
      errorCodes.not_found
    )
  }

  if (updateData.name && updateData.name !== product.name) {
    const baseSlug = generateSlug(updateData.name)
    updateData.slug = await generateUniqueSlug(baseSlug, async (s) => {
      return await findOneProduct({ slug: s, _id: { $ne: productId } })
    })
  }

  if (updateData.sku && updateData.sku !== product.sku) {
    const existing = await findOneProductLean({
      sku: updateData.sku,
      _id: { $ne: productId },
    })
    if (existing) {
      throw new CustomError(
        statusCodes.conflict,
        'SKU already exists',
        errorCodes.already_exist
      )
    }
  }

  if (updateData.category) {
    const category = await findCategoryByIdLean(updateData.category)
    if (!category) {
      throw new CustomError(
        statusCodes.notFound,
        'Category not found',
        errorCodes.not_found
      )
    }
  }

  if (updateData.subcategory) {
    const catId = updateData.category || product.category
    const subcategory = await findCategoryByIdLean(updateData.subcategory)
    if (!subcategory || String(subcategory.parent) !== String(catId)) {
      throw new CustomError(
        statusCodes.badRequest,
        'Invalid subcategory for the selected category',
        errorCodes.invalid_input
      )
    }
  }

  if (updateData.brand) {
    const brand = await findBrandByIdLean(updateData.brand)
    if (!brand) {
      throw new CustomError(
        statusCodes.notFound,
        'Brand not found',
        errorCodes.not_found
      )
    }
  }

  if (updateData.subcategory === '') {
    updateData.subcategory = null
  }
  if (updateData.brand === '') {
    updateData.brand = null
  }
  if (updateData.group === '') {
    updateData.group = null
  }

  const productCode = product.productCode || updateData.productCode
  if (
    updateData.variantCombinations &&
    updateData.variantCombinations.length > 0 &&
    productCode
  ) {
    updateData.variantCombinations = updateData.variantCombinations.map(
      (vc, i) => ({
        ...vc,
        variantCode: `${productCode}v${i + 1}`,
      })
    )
  }

  if (updateData.companyProductCodes !== undefined) {
    updateData.companyProductCodes = await normalizeCompanyProductCodes(
      updateData.companyProductCodes
    )
  }

  const updated = await findProductByIdAndUpdateWithPopulate(
    productId,
    updateData
  )

  return updated
}

export const deleteProduct = async ({ productId }) => {
  const product = await findProductByIdLean(productId)
  if (!product) {
    throw new CustomError(
      statusCodes.notFound,
      'Product not found',
      errorCodes.not_found
    )
  }

  await deleteProductById(productId)

  return {
    deletedProduct: {
      id: product._id,
      name: product.name,
      deletedAt: new Date().toISOString(),
    },
  }
}
