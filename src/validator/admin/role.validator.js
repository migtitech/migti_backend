import Joi from 'joi'

export const createRoleSchema = Joi.object({
  name: Joi.string().required().min(2).max(50),
  description: Joi.string().optional().allow(''),
  permissions: Joi.array().items(Joi.string()).min(1).required(),
})

export const listRoleSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().allow('', null),
})

export const getRoleByIdSchema = Joi.object({
  roleId: Joi.string().required(),
})

export const updateRoleSchema = Joi.object({
  roleId: Joi.string().required(),
  name: Joi.string().min(2).max(50).optional(),
  description: Joi.string().optional().allow(''),
  permissions: Joi.array().items(Joi.string()).min(1).optional(),
})

export const deleteRoleSchema = Joi.object({
  roleId: Joi.string().required(),
})
