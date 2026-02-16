import Joi from 'joi'

export const createIndustryBranchSchema = Joi.object({
  industryId: Joi.string().required(),
  name: Joi.string().required().min(1).max(100),
  location: Joi.string().optional().allow('').max(200),
  address: Joi.string().optional().allow('').max(500),
})

export const listIndustryBranchSchema = Joi.object({
  pageNumber: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(10),
  industryId: Joi.string().optional().allow('', null),
  search: Joi.string().optional().allow('', null),
})

export const getIndustryBranchByIdSchema = Joi.object({
  industryBranchId: Joi.string().required(),
})

export const updateIndustryBranchSchema = Joi.object({
  industryBranchId: Joi.string().required(),
  industryId: Joi.string().optional(),
  name: Joi.string().min(1).max(100).optional(),
  location: Joi.string().optional().allow('').max(200),
  address: Joi.string().optional().allow('').max(500),
})

export const deleteIndustryBranchSchema = Joi.object({
  industryBranchId: Joi.string().required(),
})
