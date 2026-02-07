import Joi from 'joi'

export const createAreaSchema = Joi.object({
  companyId: Joi.string().required(),
  branchId: Joi.string().required(),
  name: Joi.string().required().min(2).max(100),
  city: Joi.string().required().min(2).max(100),
  areaType: Joi.string().valid('market', 'industry').required(),
})

export const listAreaSchema = Joi.object({
  pageNumber: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().allow('', null),
  companyId: Joi.string().allow('', null),
  branchId: Joi.string().allow('', null),
  areaType: Joi.string().valid('market', 'industry').allow('', null),
})

export const getAreaByIdSchema = Joi.object({
  areaId: Joi.string().required(),
})

export const updateAreaSchema = Joi.object({
  areaId: Joi.string().required(),
  companyId: Joi.string().optional(),
  branchId: Joi.string().optional(),
  name: Joi.string().min(2).max(100).optional(),
  city: Joi.string().min(2).max(100).optional(),
  areaType: Joi.string().valid('market', 'industry').optional(),
})

export const deleteAreaSchema = Joi.object({
  areaId: Joi.string().required(),
})
