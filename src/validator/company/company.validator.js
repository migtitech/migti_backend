import Joi from 'joi'

export const createCompanySchema = Joi.object({
  name: Joi.string().required().min(2).max(100),
  logoUrl: Joi.string().uri().optional().allow(''),
  email: Joi.string().email().required(),
  brandName: Joi.string().required().min(2).max(100),
  gst: Joi.string().optional().allow(''),
})

export const listCompanySchema = Joi.object({
  pageNumber: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().allow('', null),
})

export const getCompanyByIdSchema = Joi.object({
  companyId: Joi.string().required(),
})

export const updateCompanySchema = Joi.object({
  companyId: Joi.string().required(),
  name: Joi.string().min(2).max(100).optional(),
  logoUrl: Joi.string().uri().optional().allow(''),
  email: Joi.string().email().optional(),
  brandName: Joi.string().min(2).max(100).optional(),
  gst: Joi.string().optional().allow(''),
})

export const deleteCompanySchema = Joi.object({
  companyId: Joi.string().required(),
})
