import Joi from 'joi'

const objectIdSchema = Joi.string().pattern(/^[a-fA-F0-9]{24}$/)

export const createQueryNewProductSchema = Joi.object({
  name: Joi.string().required().min(1).max(200),
  description: Joi.string().allow('', null).max(2000),
  unit: Joi.string().allow('', null).max(50),
  hsnNumber: Joi.string().allow('', null).max(100),
  modelNumber: Joi.string().allow('', null).max(100),
  qty: Joi.number().integer().min(0).optional().default(1),
  groupId: objectIdSchema.allow(null, '').optional(),
  categoryId: objectIdSchema.allow(null, '').optional(),
  variants: Joi.array().items(Joi.string().allow('', null)).default([]),
  images: Joi.array().items(Joi.string().allow('', null)).default([]),
})

export const listQueryNewProductSchema = Joi.object({
  pageNumber: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().allow('', null),
  name: Joi.string().allow('', null),
  description: Joi.string().allow('', null),
  hsnNumber: Joi.string().allow('', null),
})

export const getQueryNewProductByIdSchema = Joi.object({
  productId: Joi.string().required(),
})

export const deleteQueryNewProductSchema = Joi.object({
  productId: Joi.string().required(),
})
