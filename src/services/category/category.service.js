import {
  findOneCategory,
  findOneCategoryLean,
  findCategoryByIdLean,
  findCategoriesLean,
  findCategoryByIdAndUpdate,
  createCategory,
  countCategories,
  findCategoriesWithListPopulate,
  findAllCategoriesWithPopulate,
  findCategoryByIdWithPopulate,
  findSubcategoriesByParent,
  findCategoryByIdAndUpdateWithPopulate,
  deleteCategoryById,
} from '../../repository/category.repository.js'
import { countProducts } from '../../repository/product.repository.js'
import CustomError from '../../utils/exception.js'
import { statusCodes, errorCodes } from '../../core/common/constant.js'
import { generateSlug, generateUniqueSlug } from '../../utils/slugGenerator.js'

const generateCategoryCode = async (parentId) => {
  if (!parentId) {
    const roots = await findCategoriesLean(
      {
        parent: null,
        isDeleted: false,
        categoryCode: { $exists: true, $ne: '' },
      },
      { categoryCode: 1 }
    )
    const nums = roots
      .map((c) => {
        const m = c.categoryCode?.match(/^MIG(\d+)$/i)
        return m ? parseInt(m[1], 10) : 0
      })
      .filter((n) => n > 0)
    const next = nums.length > 0 ? Math.max(...nums) + 1 : 1
    return `MIG${String(next).padStart(2, '0')}`
  }
  const parent = await findCategoryByIdLean(parentId)
  let parentCode = parent?.categoryCode
  if (!parentCode) {
    parentCode = await generateCategoryCode(parent?.parent || null)
    await findCategoryByIdAndUpdate(parentId, {
      categoryCode: parentCode,
    })
  }
  const prefix = parent.categoryCode
  const subs = await findCategoriesLean(
    {
      parent: parentId,
      isDeleted: false,
      categoryCode: { $exists: true, $ne: '' },
    },
    { categoryCode: 1 }
  )
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
    return await findOneCategory({ slug: s })
  })

  const parentId = data.parent || null

  if (parentId) {
    const parentCategory = await findCategoryByIdLean(parentId)
    if (!parentCategory) {
      throw new CustomError(
        statusCodes.notFound,
        'Parent category not found',
        errorCodes.not_found
      )
    }
  }

  const existing = await findOneCategoryLean({
    name: data.name,
    parent: parentId,
    isDeleted: false,
  })

  if (existing) {
    throw new CustomError(
      statusCodes.conflict,
      'Category already exists under this parent',
      errorCodes.already_exist
    )
  }

  const categoryCode = await generateCategoryCode(parentId)

  const category = await createCategory({
    ...data,
    slug,
    group: data.group || null,
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
  group,
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

  if (group === 'null' || group === '') {
    filter.group = null
  } else if (group) {
    filter.group = group
  }

  if (status) {
    filter.status = status
  }

  const totalItems = await countCategories(filter)

  const categories = await findCategoriesWithListPopulate(filter, { skip, limit })

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

export const getAllCategories = async () => {
  const categories = await findAllCategoriesWithPopulate()

  return { categories }
}

export const getCategoryById = async ({ categoryId }) => {
  const category = await findCategoryByIdWithPopulate(categoryId)

  if (!category) {
    throw new CustomError(
      statusCodes.notFound,
      'Category not found',
      errorCodes.not_found
    )
  }

  const subcategoriesRaw = await findSubcategoriesByParent(categoryId)

  const subcategories = subcategoriesRaw.map((s) => ({
    ...s,
    name: s.name ?? '',
  }))

  return { ...category, subcategories }
}

export const updateCategory = async ({ categoryId, ...updateData }) => {
  const category = await findCategoryByIdLean(categoryId)
  if (!category) {
    throw new CustomError(
      statusCodes.notFound,
      'Category not found',
      errorCodes.not_found
    )
  }

  if (updateData.name && updateData.name !== category.name) {
    const baseSlug = generateSlug(updateData.name)
    updateData.slug = await generateUniqueSlug(baseSlug, async (s) => {
      return await findOneCategory({ slug: s, _id: { $ne: categoryId } })
    })
  }

  if (updateData.parent === '') {
    updateData.parent = null
  }
  if (updateData.group === '') {
    updateData.group = null
  }

  const updated = await findCategoryByIdAndUpdateWithPopulate(
    categoryId,
    updateData
  )

  return updated
}

export const deleteCategory = async ({ categoryId }) => {
  const category = await findCategoryByIdLean(categoryId)
  if (!category) {
    throw new CustomError(
      statusCodes.notFound,
      'Category not found',
      errorCodes.not_found
    )
  }

  const subCount = await countCategories({
    parent: categoryId,
    isDeleted: false,
  })
  if (subCount > 0) {
    throw new CustomError(
      statusCodes.conflict,
      'Cannot delete category with subcategories. Remove subcategories first.',
      errorCodes.conflict
    )
  }

  const productCount = await countProducts({
    $or: [{ category: categoryId }, { subcategory: categoryId }],
    isDeleted: false,
  })
  if (productCount > 0) {
    throw new CustomError(
      statusCodes.conflict,
      'Cannot delete category with associated products.',
      errorCodes.conflict
    )
  }

  await deleteCategoryById(categoryId)

  return {
    deletedCategory: {
      id: category._id,
      name: category.name,
      deletedAt: new Date().toISOString(),
    },
  }
}
