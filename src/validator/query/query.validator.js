import Joi from 'joi'

const companyInfoSchema = Joi.object({
  name: Joi.string().allow('').optional(),
  area: Joi.string().allow('').optional(),
  location: Joi.string().allow('').optional(),
  address: Joi.string().allow('').optional(),
  purchase_manager_name: Joi.string().allow('').optional(),
  purchase_manager_phone: Joi.string().allow('').optional(),
  email: Joi.string().email({ tlds: { allow: false } }).allow('').optional(),
})

const productVariantSchema = Joi.object({
  variantName: Joi.string().allow('').optional(),
  quantity: Joi.number().integer().min(0).optional().default(1),
})

const productItemSchema = Joi.object({
  productName: Joi.string().required().trim(),
  quantity: Joi.number().integer().min(0).required(),
  unit: Joi.string().allow('').optional(),
  variants: Joi.array().items(productVariantSchema).optional().default([]),
  remark: Joi.string().allow('').optional(),
  product_id: Joi.string().allow(null, '').optional(),
})

const deliveryInfoSchema = Joi.object({
  location: Joi.string().allow('').optional(),
  contactPersonName: Joi.string().allow('').optional(),
  contactPersonPhone: Joi.string().allow('').optional(),
  expectedDateByCompany: Joi.date().allow(null).optional(),
  urgent: Joi.boolean().optional().default(false),
})

const queryStatusValues = [
  'pending',
  'followup01pending',
  'followup02pending',
  'followup03pending',
  'progress',
  'convertedToQuotation',
  'closed',
]

export const createQuerySchema = Joi.object({
  companyInfo: companyInfoSchema.optional().default({}),
  industry_id: Joi.string().allow(null, '').optional(),
  products: Joi.array().items(productItemSchema).optional().default([]),
  delivery: deliveryInfoSchema.optional().default({}),
  status: Joi.string().valid(...queryStatusValues).optional().default('pending'),
  created_by: Joi.string().allow(null, '').optional(),
})

export const listQuerySchema = Joi.object({
  pageNumber: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().allow('').optional(),
})

export const getQueryByIdSchema = Joi.object({
  queryId: Joi.string().required(),
})

export const updateQuerySchema = Joi.object({
  queryId: Joi.string().required(),
  companyInfo: companyInfoSchema.optional(),
  industry_id: Joi.string().allow(null, '').optional(),
  products: Joi.array().items(productItemSchema).optional(),
  delivery: deliveryInfoSchema.optional(),
  status: Joi.string().valid(...queryStatusValues).optional(),
})

export const listQueryActivitiesSchema = Joi.object({
  queryId: Joi.string().required(),
})

export const recordQueryActivitySchema = Joi.object({
  queryId: Joi.string().required(),
  type: Joi.string().valid('viewed', 'action', 'follow_up').required(),
  performedBy: Joi.string().required(),
  meta: Joi.object({
    action: Joi.string().allow('').optional(),
    followUpStatus: Joi.string().allow('').optional(),
    note: Joi.string().allow('').optional(),
  }).optional(),
})

export const deleteQuerySchema = Joi.object({
  queryId: Joi.string().required(),
})
