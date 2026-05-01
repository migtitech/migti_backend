import Joi from 'joi'

const objectIdPattern = /^[0-9a-fA-F]{24}$/
const objectIdJoi = Joi.string().pattern(objectIdPattern).messages({
  'string.pattern.base': 'id must be a valid Mongo ObjectId',
})

const PRO_BUCKET_STATUSES = ['pending', 'rate_submitted', 'fulfilled', '']

export const listProBucketQueryProductsSchema = Joi.object({
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
    .valid(...PRO_BUCKET_STATUSES)
    .allow(null, '')
    .optional(),
  /** Comma-separated group ObjectIds; must be subset of employee assigned_groups */
  groupIds: Joi.string().allow('', null).optional(),
}).unknown(true)

export const getProBucketByIdParamSchema = Joi.object({
  id: objectIdJoi.required(),
})

const rateItemSchema = Joi.object({
  // Omitted key = optional; null or "" = no supplier. Do not use Joi.valid(undefined) — Joi forbids undefined in valid().
  supplierId: Joi.alternatives()
    .try(objectIdJoi, Joi.string().allow(''), Joi.valid(null))
    .optional(),
  rate: Joi.number().required().min(0),
  unit: Joi.string().allow('', null).optional(),
  remark: Joi.string().allow('', null).optional(),
})

export const appendProBucketRatesSchema = Joi.object({
  rates: Joi.array().items(rateItemSchema).min(1).required(),
})

export const appendProBucketRatesParamSchema = Joi.object({
  id: objectIdJoi.required(),
})
