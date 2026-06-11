import CategoryModel from '../models/category.model.js'

export const findOneCategory = (filter) => CategoryModel.findOne(filter)

export const findOneCategoryLean = (filter) =>
  CategoryModel.findOne(filter).lean()

export const findCategoryByIdLean = (categoryId) =>
  CategoryModel.findById(categoryId).lean()

export const findCategoriesLean = (filter, projection) =>
  CategoryModel.find(filter, projection).lean()

export const findCategoryByIdAndUpdate = (categoryId, updateData) =>
  CategoryModel.findByIdAndUpdate(categoryId, updateData)

export const createCategory = (data) => CategoryModel.create(data)

export const countCategories = (filter) => CategoryModel.countDocuments(filter)

export const findCategoriesWithListPopulate = (filter, { skip, limit }) =>
  CategoryModel.find(filter)
    .populate('group', 'name code')
    .populate('parent', 'name slug categoryCode')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()

export const findAllCategoriesWithPopulate = () =>
  CategoryModel.find({ isDeleted: false })
    .populate('group', 'name code')
    .populate('parent', 'name slug categoryCode')
    .sort({ createdAt: -1 })
    .lean()

export const findCategoryByIdWithPopulate = (categoryId) =>
  CategoryModel.findById(categoryId)
    .populate('group', 'name code')
    .populate('parent', 'name slug')
    .lean()

export const findSubcategoriesByParent = (categoryId) =>
  CategoryModel.find({
    parent: categoryId,
    isDeleted: false,
  })
    .select(
      '_id name categoryCode description status sortOrder group parent createdAt'
    )
    .lean()

export const findCategoryByIdAndUpdateWithPopulate = (categoryId, updateData) =>
  CategoryModel.findByIdAndUpdate(categoryId, updateData, {
    new: true,
    runValidators: true,
  })
    .populate('group', 'name code')
    .populate('parent', 'name slug categoryCode')
    .lean()

export const deleteCategoryById = (categoryId) =>
  CategoryModel.findByIdAndDelete(categoryId)

export const findCategoryByIdWithGroupParent = (categoryId) =>
  CategoryModel.findById(categoryId).select('group parent').lean()

export const findCategoryByIdWithParent = (categoryId) =>
  CategoryModel.findById(categoryId).select('parent').lean()

const categoryRepository = {
  find: (filter) => CategoryModel.find(filter),
  findOne: (filter) => CategoryModel.findOne(filter),
  findById: (id) => CategoryModel.findById(id),
}

export default categoryRepository
