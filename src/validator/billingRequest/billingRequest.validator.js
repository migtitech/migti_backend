import Joi from 'joi'

const objectIdPattern = /^[0-9a-fA-F]{24}$/
const oid = Joi.string().pattern(objectIdPattern).messages({
  'string.pattern.base': 'Must be a valid Mongo ObjectId',
})

const supplierSchema = Joi.object({
  _id: Joi.string().optional().allow('', null),
  name: Joi.string().optional().allow('', null),
  shopname: Joi.string().optional().allow('', null),
  address: Joi.string().optional().allow('', null),
  phone_1: Joi.string().optional().allow('', null),
  email: Joi.string().optional().allow('', null),
  gst: Joi.string().optional().allow('', null),
}).unknown(true)

const productItemSchema = Joi.object({
  poProductId: oid.required(),
  amount: Joi.number().positive().required(),
  billDocId: oid.optional().allow('', null),
  productImageDocId: oid.optional().allow('', null),
  productImageDocIds: Joi.array().items(oid).optional(),
  supplierSnapshot: supplierSchema.optional().allow(null),
  remark: Joi.string().max(2000).allow('').optional(),
})

export const createBillingRequestSchema = Joi.object({
  products: Joi.array().items(productItemSchema).min(1).required(),
})
