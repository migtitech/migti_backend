import Joi from 'joi'

export const createQueryNewProductSchema = Joi.object({
  name: Joi.string().required().min(1).max(200),
  unit: Joi.string().allow('', null).max(50),
  hsnNumber: Joi.string().allow('', null).max(100),
  modelNumber: Joi.string().allow('', null).max(100),
  variants: Joi.array().items(Joi.string().allow('', null)).default([]),
  images: Joi.array().items(Joi.string().allow('', null)).default([]),
})

export const listQueryNewProductSchema = Joi.object({
  pageNumber: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().allow('', null),
})

export const getQueryNewProductByIdSchema = Joi.object({
  productId: Joi.string().required(),
})

export const deleteQueryNewProductSchema = Joi.object({
  productId: Joi.string().required(),
})
