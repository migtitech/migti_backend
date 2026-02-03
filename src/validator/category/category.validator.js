import Joi from 'joi'

export const createCategorySchema = Joi.object({
  name: Joi.string().required().min(2).max(100),
  description: Joi.string().optional().allow(''),
  parent: Joi.string().optional().allow(null, ''),
  image: Joi.string().optional().allow(''),
  sortOrder: Joi.number().integer().optional().default(0),
  status: Joi.string().valid('active', 'inactive').optional().default('active'),
})

export const listCategorySchema = Joi.object({
  pageNumber: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().allow('', null),
  parent: Joi.string().allow('', null),
  status: Joi.string().valid('active', 'inactive').allow('', null),
})

export const getCategoryByIdSchema = Joi.object({
  categoryId: Joi.string().required(),
})

export const updateCategorySchema = Joi.object({
  categoryId: Joi.string().required(),
  name: Joi.string().min(2).max(100).optional(),
  description: Joi.string().optional().allow(''),
  parent: Joi.string().optional().allow(null, ''),
  image: Joi.string().optional().allow(''),
  sortOrder: Joi.number().integer().optional(),
  status: Joi.string().valid('active', 'inactive').optional(),
})

export const deleteCategorySchema = Joi.object({
  categoryId: Joi.string().required(),
})
