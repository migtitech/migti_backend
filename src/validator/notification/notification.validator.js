import Joi from 'joi'

export const listNotificationsSchema = Joi.object({
  unreadOnly: Joi.alternatives()
    .try(Joi.boolean(), Joi.string().valid('true', 'false', '1', '0'))
    .optional(),
  pageNumber: Joi.number().integer().min(1).optional(),
  pageSize: Joi.number().integer().min(1).max(100).optional(),
}).unknown(true)

export const createNotificationsSchema = Joi.object({
  title: Joi.string().required().min(1).max(500).trim(),
  description: Joi.string().allow('', null).optional().default(''),
  branchId: Joi.string().required(),
  roles: Joi.array().items(Joi.string().trim().min(1)).min(1).required(),
}).unknown(true)

export const notificationIdParamSchema = Joi.object({
  id: Joi.string().required(),
}).unknown(true)
