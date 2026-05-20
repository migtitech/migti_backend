import Joi from 'joi'

const objectIdPattern = /^[0-9a-fA-F]{24}$/
const objectIdJoi = Joi.string().pattern(objectIdPattern).messages({
  'string.pattern.base': 'id must be a valid Mongo ObjectId',
})

export const listDeliveryApprovalBucketSchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  pageNumber: Joi.number().integer().min(1).optional(),
  pageSize: Joi.number().integer().min(1).max(100).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  search: Joi.string().allow('', null).optional(),
  deliverySubStatus: Joi.string().allow('', null).optional(),
  status: Joi.string().allow('', null).optional(),
  from: Joi.alternatives()
    .try(Joi.string(), Joi.date())
    .allow(null, '')
    .optional(),
  to: Joi.alternatives()
    .try(Joi.string(), Joi.date())
    .allow(null, '')
    .optional(),
}).unknown(true)

export const deliveryApprovalBucketIdParamSchema = Joi.object({
  id: objectIdJoi.required(),
})

export const updatePoProductEnrichmentSchema = Joi.object({
  remark: Joi.string().allow('', null).optional(),
  description: Joi.string().allow('', null).optional(),
  targetRate: Joi.number().min(0).allow(null).optional(),
  quantity: Joi.number().min(0).optional(),
  status: Joi.string().valid('pending').optional(),
}).unknown(false)

export const createPoProductSchema = Joi.object({
  purchaseOrderId: objectIdJoi.required(),
  poCode: Joi.string().allow('', null).optional(),
  productName: Joi.string().trim().min(1).required(),
  unit: Joi.string().allow('', null).optional(),
  rawProductCode: Joi.string().allow('', null).optional(),
  hsnNumber: Joi.string().allow('', null).optional(),
  modelNumber: Joi.string().allow('', null).optional(),
  gstPercentage: Joi.number().min(0).max(100).allow(null).optional(),
  description: Joi.string().allow('', null).optional(),
  quantity: Joi.number().min(0).required(),
  targetRate: Joi.number().min(0).allow(null).optional(),
  remark: Joi.string().allow('', null).optional(),
  companyInfo: Joi.object().allow(null).optional(),
}).unknown(false)
