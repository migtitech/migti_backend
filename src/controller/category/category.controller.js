import { Message, statusCodes } from '../../core/common/constant.js'
import {
  createCategorySchema,
  listCategorySchema,
  getCategoryByIdSchema,
  updateCategorySchema,
  deleteCategorySchema,
} from '../../validator/category/category.validator.js'
import {
  addCategory,
  listCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from '../../services/category/category.service.js'

export const createCategoryController = async (req, res) => {
  const { error, value } = createCategorySchema.validate(req.body, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const result = await addCategory(value)
  return res.status(statusCodes.created).json({
    success: true,
    message: 'Category created successfully',
    data: result,
  })
}

export const listCategoriesController = async (req, res) => {
  const { error, value } = listCategorySchema.validate(req.query, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const result = await listCategories(value)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Categories retrieved successfully',
    data: result,
  })
}

export const getCategoryByIdController = async (req, res) => {
  const { error, value } = getCategoryByIdSchema.validate(req.query, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const result = await getCategoryById(value)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Category details retrieved successfully',
    data: result,
  })
}

export const updateCategoryController = async (req, res) => {
  const { error, value } = updateCategorySchema.validate(
    { ...req.body, ...req.query },
    {
      abortEarly: false,
    },
  )
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const result = await updateCategory(value)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Category updated successfully',
    data: result,
  })
}

export const deleteCategoryController = async (req, res) => {
  const { error, value } = deleteCategorySchema.validate(req.query, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const result = await deleteCategory(value)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Category deleted successfully',
    data: result,
  })
}
