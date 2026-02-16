import Joi from 'joi'

export const createBrandSchema = Joi.object({
  name: Joi.string().required().min(2).max(100),
  description: Joi.string().optional().allow(''),
  status: Joi.string().valid('active', 'inactive').optional().default('active'),
})

export const listBrandSchema = Joi.object({
  pageNumber: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().allow('', null),
  status: Joi.string().valid('active', 'inactive').allow('', null),
})

export const getBrandByIdSchema = Joi.object({
  brandId: Joi.string().required(),
})

export const updateBrandSchema = Joi.object({
  brandId: Joi.string().required(),
  name: Joi.string().min(2).max(100).optional(),
  description: Joi.string().optional().allow(''),
  status: Joi.string().valid('active', 'inactive').optional(),
})

export const deleteBrandSchema = Joi.object({
  brandId: Joi.string().required(),
})
