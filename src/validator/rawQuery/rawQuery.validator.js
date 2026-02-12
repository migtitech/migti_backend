import Joi from 'joi'

export const createRawQuerySchema = Joi.object({
  priority: Joi.string().required().min(2).max(50),
  title: Joi.string().required().min(2).max(200),
  company_info: Joi.string().allow('', null).optional(),
  industry_id: Joi.string().required(),
  supplier_id: Joi.string().allow('', null).optional(),
  description: Joi.string().required().min(5).max(2000),
  files: Joi.array().items(Joi.string()).default([]),
  created_by: Joi.string().required(),
})

export const listRawQuerySchema = Joi.object({
  pageNumber: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().allow('').optional(),
})

export const getRawQueryByIdSchema = Joi.object({
  rawQueryId: Joi.string().required(),
})

export const updateRawQuerySchema = Joi.object({
  rawQueryId: Joi.string().required(),
  priority: Joi.string().min(2).max(50).optional(),
  title: Joi.string().min(2).max(200).optional(),
  company_info: Joi.string().min(2).max(200).allow('', null).optional(),
  industry_id: Joi.string().allow('', null).optional(),
  supplier_id: Joi.string().allow('', null).optional(),
  description: Joi.string().min(5).max(2000).optional(),
  files: Joi.array().items(Joi.string()).optional(),
  created_by: Joi.string().optional(),
})

export const deleteRawQuerySchema = Joi.object({
  rawQueryId: Joi.string().required(),
})

export const listRawQueryActivitiesSchema = Joi.object({
  rawQueryId: Joi.string().required(),
})

export const recordRawQueryActivitySchema = Joi.object({
  rawQueryId: Joi.string().required(),
  type: Joi.string().valid('viewed', 'action', 'follow_up').required(),
  performedBy: Joi.string().required(),
  meta: Joi.object({
    action: Joi.string().allow('').optional(),
    followUpStatus: Joi.string().allow('').optional(),
    note: Joi.string().allow('').optional(),
  }).optional(),
})
