import Joi from 'joi'

export const createGroupSchema = Joi.object({
  name: Joi.string().required().min(2).max(100),
  code: Joi.string().optional().allow(''),
  description: Joi.string().optional().allow(''),
  status: Joi.string().valid('active', 'inactive').optional().default('active'),
})

export const listGroupSchema = Joi.object({
  pageNumber: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().allow('', null),
  status: Joi.string().valid('active', 'inactive').allow('', null),
})

export const getGroupByIdSchema = Joi.object({
  groupId: Joi.string().required(),
})

export const updateGroupSchema = Joi.object({
  groupId: Joi.string().required(),
  name: Joi.string().min(2).max(100).optional(),
  code: Joi.string().optional().allow(''),
  description: Joi.string().optional().allow(''),
  status: Joi.string().valid('active', 'inactive').optional(),
})

export const deleteGroupSchema = Joi.object({
  groupId: Joi.string().required(),
})
