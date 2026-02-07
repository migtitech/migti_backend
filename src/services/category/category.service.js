import CategoryModel from '../../models/category.model.js'
import ProductModel from '../../models/product.model.js'
import CustomError from '../../utils/exception.js'
import { statusCodes, errorCodes } from '../../core/common/constant.js'
import { generateSlug, generateUniqueSlug } from '../../utils/slugGenerator.js'

const generateCategoryCode = async (parentId) => {
  if (!parentId) {
    const roots = await CategoryModel.find(
      { parent: null, isDeleted: false, categoryCode: { $exists: true, $ne: '' } },
      { categoryCode: 1 },
    )
      .lean()
    const nums = roots
      .map((c) => {
        const m = c.categoryCode?.match(/^MIG(\d+)$/i)
        return m ? parseInt(m[1], 10) : 0
      })
      .filter((n) => n > 0)
    const next = nums.length > 0 ? Math.max(...nums) + 1 : 1
    return `MIG${String(next).padStart(2, '0')}`
  }
  const parent = await CategoryModel.findById(parentId).lean()
  let parentCode = parent?.categoryCode
  if (!parentCode) {
    parentCode = await generateCategoryCode(parent?.parent || null)
    await CategoryModel.findByIdAndUpdate(parentId, { categoryCode: parentCode })
  }
  const prefix = parent.categoryCode
  const subs = await CategoryModel.find(
    { parent: parentId, isDeleted: false, categoryCode: { $exists: true, $ne: '' } },
    { categoryCode: 1 },
  ).lean()
  const re = new RegExp(`^${prefix}SUB(\\d+)$`, 'i')
  const nums = subs
    .map((c) => {
      const m = c.categoryCode?.match(re)
      return m ? parseInt(m[1], 10) : 0
    })
    .filter((n) => n > 0)
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1
  return `${prefix}SUB${String(next).padStart(2, '0')}`
}

export const addCategory = async (data) => {
  const baseSlug = generateSlug(data.name)
  const slug = await generateUniqueSlug(baseSlug, async (s) => {
    return await CategoryModel.findOne({ slug: s })
  })

  const parentId = data.parent || null

  if (parentId) {
    const parentCategory = await CategoryModel.findById(parentId).lean()
    if (!parentCategory) {
      throw new CustomError(
        statusCodes.notFound,
        'Parent category not found',
        errorCodes.not_found,
      )
    }
  }

  const existing = await CategoryModel.findOne({
    name: data.name,
    parent: parentId,
    isDeleted: false,
  }).lean()
  if (existing) {
    throw new CustomError(
      statusCodes.conflict,
      'Category already exists under this parent',
      errorCodes.already_exist,
    )
  }

  const categoryCode = await generateCategoryCode(parentId)

  const category = await CategoryModel.create({
    ...data,
    slug,
    parent: parentId,
    categoryCode,
  })

  return category.toObject()
}

export const listCategories = async ({
  pageNumber = 1,
  pageSize = 10,
  search = '',
  parent,
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

  if (parent === 'null' || parent === '') {
    filter.parent = null
  } else if (parent) {
    filter.parent = parent
  }

  if (status) {
    filter.status = status
  }

  const totalItems = await CategoryModel.countDocuments(filter)

  const categories = await CategoryModel.find(filter)
    .populate('parent', 'name slug categoryCode')
    .sort({ sortOrder: 1, createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()

  const totalPages = Math.ceil(totalItems / limit)

  return {
    categories,
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

export const getCategoryById = async ({ categoryId }) => {
  const category = await CategoryModel.findById(categoryId)
    .populate('parent', 'name slug')
    .lean()

  if (!category) {
    throw new CustomError(
      statusCodes.notFound,
      'Category not found',
      errorCodes.not_found,
    )
  }

  const subcategories = await CategoryModel.find({
    parent: categoryId,
    isDeleted: false,
  }).lean()

  return { ...category, subcategories }
}

export const updateCategory = async ({ categoryId, ...updateData }) => {
  const category = await CategoryModel.findById(categoryId).lean()
  if (!category) {
    throw new CustomError(
      statusCodes.notFound,
      'Category not found',
      errorCodes.not_found,
    )
  }

  if (updateData.name && updateData.name !== category.name) {
    const baseSlug = generateSlug(updateData.name)
    updateData.slug = await generateUniqueSlug(baseSlug, async (s) => {
      return await CategoryModel.findOne({ slug: s, _id: { $ne: categoryId } })
    })
  }

  if (updateData.parent === '') {
    updateData.parent = null
  }

  const updated = await CategoryModel.findByIdAndUpdate(categoryId, updateData, {
    new: true,
    runValidators: true,
  })
    .populate('parent', 'name slug categoryCode')
    .lean()

  return updated
}

export const deleteCategory = async ({ categoryId }) => {
  const category = await CategoryModel.findById(categoryId).lean()
  if (!category) {
    throw new CustomError(
      statusCodes.notFound,
      'Category not found',
      errorCodes.not_found,
    )
  }

  const subCount = await CategoryModel.countDocuments({
    parent: categoryId,
    isDeleted: false,
  })
  if (subCount > 0) {
    throw new CustomError(
      statusCodes.conflict,
      'Cannot delete category with subcategories. Remove subcategories first.',
      errorCodes.conflict,
    )
  }

  const productCount = await ProductModel.countDocuments({
    $or: [{ category: categoryId }, { subcategory: categoryId }],
    isDeleted: false,
  })
  if (productCount > 0) {
    throw new CustomError(
      statusCodes.conflict,
      'Cannot delete category with associated products.',
      errorCodes.conflict,
    )
  }

  await CategoryModel.findByIdAndDelete(categoryId)

  return {
    deletedCategory: {
      id: category._id,
      name: category.name,
      deletedAt: new Date().toISOString(),
    },
  }
}
