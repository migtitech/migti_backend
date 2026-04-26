import Joi from 'joi'

const objectIdPattern = /^[0-9a-fA-F]{24}$/
const objectIdJoi = Joi.string().pattern(objectIdPattern).messages({
  'string.pattern.base': 'id must be a valid Mongo ObjectId',
})

const INVENTORY_STATUSES = [
  'pending',
  'purchased',
  'inventory_received',
  'ready_for_dispatchment',
  'delivered',
  '',
]

export const listInventoryBucketSchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  pageNumber: Joi.number().integer().min(1).optional(),
  pageSize: Joi.number().integer().min(1).max(100).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  search: Joi.string().allow('', null).optional(),
  from: Joi.alternatives()
    .try(Joi.string(), Joi.date())
    .allow(null, '')
    .optional(),
  to: Joi.alternatives()
    .try(Joi.string(), Joi.date())
    .allow(null, '')
    .optional(),
  status: Joi.string()
    .valid(...INVENTORY_STATUSES)
    .allow(null, '')
    .optional(),
}).unknown(true)

export const inventoryBucketIdParamSchema = Joi.object({
  id: objectIdJoi.required(),
})
