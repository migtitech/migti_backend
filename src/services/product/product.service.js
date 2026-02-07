import ProductModel from '../../models/product.model.js'
import CategoryModel from '../../models/category.model.js'
import BrandModel from '../../models/brand.model.js'
import CustomError from '../../utils/exception.js'
import { statusCodes, errorCodes } from '../../core/common/constant.js'
import { generateSlug, generateUniqueSlug } from '../../utils/slugGenerator.js'
import {
  addImagesForProduct,
  attachImagesToProducts,
  getImagesForProduct,
  updateImagesForProduct,
  deleteImagesForProduct,
} from '../image/image.service.js'

export const addProduct = async (data) => {
  const baseSlug = generateSlug(data.name)
  const slug = await generateUniqueSlug(baseSlug, async (s) => {
    return await ProductModel.findOne({ slug: s })
  })

  const existingSku = await ProductModel.findOne({ sku: data.sku }).lean()
  if (existingSku) {
    throw new CustomError(
      statusCodes.conflict,
      'Product with this SKU already exists',
      errorCodes.already_exist,
    )
  }

  const category = await CategoryModel.findById(data.category).lean()
  if (!category) {
    throw new CustomError(
      statusCodes.notFound,
      'Category not found',
      errorCodes.not_found,
    )
  }

  if (data.subcategory) {
    const subcategory = await CategoryModel.findById(data.subcategory).lean()
    if (!subcategory || String(subcategory.parent) !== String(data.category)) {
      throw new CustomError(
        statusCodes.badRequest,
        'Invalid subcategory for the selected category',
        errorCodes.invalid_input,
      )
    }
  }

  if (data.brand) {
    const brand = await BrandModel.findById(data.brand).lean()
    if (!brand) {
      throw new CustomError(
        statusCodes.notFound,
        'Brand not found',
        errorCodes.not_found,
      )
    }
  }

  const { images, variantCombinations, ...productData } = data
  const product = await ProductModel.create({
    ...productData,
    slug,
    subcategory: data.subcategory || null,
    brand: data.brand || null,
    variantCombinations: variantCombinations || [],
  })

  const variantCombosWithImages = (product.variantCombinations || []).map((combo, i) => ({
    uniqueId: combo.uniqueId,
    images: (variantCombinations || [])[i]?.images || [],
  }))
  if (images?.length || variantCombosWithImages.some((c) => c.images?.length)) {
    await addImagesForProduct(product._id, images || [], variantCombosWithImages)
  }

  const { images: imgList, variantImages } = await getImagesForProduct(product._id)
  const productObj = product.toObject()
  productObj.images = imgList
  if (productObj.variantCombinations) {
    productObj.variantCombinations = productObj.variantCombinations.map((combo) => ({
      ...combo,
      images: variantImages[combo.uniqueId] || [],
    }))
  }
  return productObj
}

export const listProducts = async ({
  pageNumber = 1,
  pageSize = 10,
  search = '',
  category,
  subcategory,
  brand,
  status,
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
      { tags: { $regex: search, $options: 'i' } },
    ]
  }

  if (category) filter.category = category
  if (subcategory) filter.subcategory = subcategory
  if (brand) filter.brand = brand
  if (status) filter.status = status

  const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 }

  const totalItems = await ProductModel.countDocuments(filter)

  const products = await ProductModel.find(filter)
    .populate('category', 'name slug')
    .populate('subcategory', 'name slug')
    .populate('brand', 'name slug logo')
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean()

  const totalPages = Math.ceil(totalItems / limit)

  const productsWithImages = await attachImagesToProducts(products)

  return {
    products: productsWithImages,
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
  const product = await ProductModel.findById(productId)
    .populate('category', 'name slug')
    .populate('subcategory', 'name slug')
    .populate('brand', 'name slug logo')
    .lean()

  if (!product) {
    throw new CustomError(
      statusCodes.notFound,
      'Product not found',
      errorCodes.not_found,
    )
  }

  const [productWithImages] = await attachImagesToProducts([product])
  return productWithImages
}

export const updateProduct = async ({ productId, ...updateData }) => {
  const product = await ProductModel.findById(productId).lean()
  if (!product) {
    throw new CustomError(
      statusCodes.notFound,
      'Product not found',
      errorCodes.not_found,
    )
  }

  if (updateData.name && updateData.name !== product.name) {
    const baseSlug = generateSlug(updateData.name)
    updateData.slug = await generateUniqueSlug(baseSlug, async (s) => {
      return await ProductModel.findOne({ slug: s, _id: { $ne: productId } })
    })
  }

  if (updateData.sku && updateData.sku !== product.sku) {
    const existing = await ProductModel.findOne({
      sku: updateData.sku,
      _id: { $ne: productId },
    }).lean()
    if (existing) {
      throw new CustomError(
        statusCodes.conflict,
        'SKU already exists',
        errorCodes.already_exist,
      )
    }
  }

  if (updateData.category) {
    const category = await CategoryModel.findById(updateData.category).lean()
    if (!category) {
      throw new CustomError(
        statusCodes.notFound,
        'Category not found',
        errorCodes.not_found,
      )
    }
  }

  if (updateData.subcategory) {
    const catId = updateData.category || product.category
    const subcategory = await CategoryModel.findById(updateData.subcategory).lean()
    if (!subcategory || String(subcategory.parent) !== String(catId)) {
      throw new CustomError(
        statusCodes.badRequest,
        'Invalid subcategory for the selected category',
        errorCodes.invalid_input,
      )
    }
  }

  if (updateData.brand) {
    const brand = await BrandModel.findById(updateData.brand).lean()
    if (!brand) {
      throw new CustomError(
        statusCodes.notFound,
        'Brand not found',
        errorCodes.not_found,
      )
    }
  }

  if (updateData.subcategory === '') {
    updateData.subcategory = null
  }
  if (updateData.brand === '') {
    updateData.brand = null
  }

  const { images, variantCombinations, ...restUpdateData } = updateData
  if (images !== undefined || variantCombinations !== undefined) {
    await updateImagesForProduct(
      productId,
      images || [],
      variantCombinations || [],
    )
  }
  if (variantCombinations !== undefined) {
    restUpdateData.variantCombinations = variantCombinations
  }

  const updated = await ProductModel.findByIdAndUpdate(productId, restUpdateData, {
    new: true,
    runValidators: true,
  })
    .populate('category', 'name slug')
    .populate('subcategory', 'name slug')
    .populate('brand', 'name slug logo')
    .lean()

  const [updatedWithImages] = await attachImagesToProducts([updated])
  return updatedWithImages
}

export const deleteProduct = async ({ productId }) => {
  const product = await ProductModel.findById(productId).lean()
  if (!product) {
    throw new CustomError(
      statusCodes.notFound,
      'Product not found',
      errorCodes.not_found,
    )
  }

  await deleteImagesForProduct(productId)
  await ProductModel.findByIdAndDelete(productId)

  return {
    deletedProduct: {
      id: product._id,
      name: product.name,
      deletedAt: new Date().toISOString(),
    },
  }
}
