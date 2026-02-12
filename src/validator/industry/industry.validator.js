import Joi from 'joi'

export const createIndustrySchema = Joi.object({
  name: Joi.string().required().min(2).max(100),
  area: Joi.string().optional().allow(null, ''),
  location: Joi.string().optional().allow(''),
  address: Joi.string().optional().allow(''),
  purchase_manager_name: Joi.string().optional().allow(''),
  purchase_manager_phone: Joi.string().optional().allow(''),
  email: Joi.string().email({ tlds: { allow: false } }).optional().allow(''),
})

export const listIndustrySchema = Joi.object({
  pageNumber: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().allow('', null),
})

export const getIndustryByIdSchema = Joi.object({
  industryId: Joi.string().required(),
})

export const updateIndustrySchema = Joi.object({
  industryId: Joi.string().required(),
  name: Joi.string().min(2).max(100).optional(),
  area: Joi.string().optional().allow(null, ''),
  location: Joi.string().optional().allow(''),
  address: Joi.string().optional().allow(''),
  purchase_manager_name: Joi.string().optional().allow(''),
  purchase_manager_phone: Joi.string().optional().allow(''),
  email: Joi.string().email({ tlds: { allow: false } }).optional().allow(''),
})

export const deleteIndustrySchema = Joi.object({
  industryId: Joi.string().required(),
})
