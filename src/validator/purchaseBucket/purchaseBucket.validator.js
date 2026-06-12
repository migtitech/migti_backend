import Joi from 'joi'

const objectIdPattern = /^[0-9a-fA-F]{24}$/
const objectIdJoi = Joi.string().pattern(objectIdPattern).messages({
  'string.pattern.base': 'id must be a valid Mongo ObjectId',
})

const PROCUREMENT_STATUSES = [
  'open',
  'payment_request_raised',
  'finance_approved',
  'purchased',
  '',
]

export const listPurchaseBucketSchema = Joi.object({
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
    .valid(...PROCUREMENT_STATUSES)
    .allow(null, '')
    .optional(),
}).unknown(true)

export const purchaseBucketIdParamSchema = Joi.object({
  id: objectIdJoi.required(),
})

export const raisePaymentRequestBodySchema = Joi.object({
  amount: Joi.number().positive().required(),
  attachmentDocumentId: objectIdJoi.required(),
  remark: Joi.string().max(4000).allow('').optional(),
  supplier: Joi.object({
    _id: Joi.string().optional().allow('', null),
    name: Joi.string().optional().allow('', null),
    shopname: Joi.string().optional().allow('', null),
    address: Joi.string().optional().allow('', null),
    phone_1: Joi.string().optional().allow('', null),
    email: Joi.string().optional().allow('', null),
    gst: Joi.string().optional().allow('', null),
  })
    .optional()
    .allow(null),
})

/** Sets `po_products.attachmentDocumentId` (product image on the line). */
export const updatePoProductLineAttachmentBodySchema = Joi.object({
  attachmentDocumentId: Joi.alternatives()
    .try(objectIdJoi, Joi.valid(null), Joi.string().valid(''))
    .required(),
})
