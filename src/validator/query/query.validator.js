import Joi from 'joi'

const purchaseManagerSchema = Joi.object({
  name: Joi.string().allow('').optional(),
  phone: Joi.string().allow('').optional(),
  email: Joi.string().email({ tlds: { allow: false } }).allow('').optional(),
})

const companyInfoSchema = Joi.object({
  name: Joi.string().allow('').optional(),
  area: Joi.string().allow('').optional(),
  location: Joi.string().allow('').optional(),
  address: Joi.string().allow('').optional(),
  purchaseManagers: Joi.array().items(purchaseManagerSchema).optional().default([]),
})

const productVariantSchema = Joi.object({
  variantName: Joi.string().allow('').optional(),
})

const productItemSchema = Joi.object({
  productName: Joi.string().required().trim(),
  quantity: Joi.number().integer().min(0).required(),
  unit: Joi.string().allow('').optional(),
  hsnNumber: Joi.string().allow('').optional(),
  modelNumber: Joi.string().allow('').optional(),
  gstPercentage: Joi.number().min(0).max(100).allow(null).optional(),
  variants: Joi.array().items(productVariantSchema).optional().default([]),
  remark: Joi.string().allow('').optional(),
  product_id: Joi.string().allow(null, '').optional(),
})

const queryStatusValues = ['drafted', 'convertedToQuotation', 'closed']

export const createQuerySchema = Joi.object({
  companyInfo: companyInfoSchema.optional().default({}),
  industry_id: Joi.string().allow(null, '').optional(),
  products: Joi.array().items(productItemSchema).optional().default([]),
  status: Joi.string().valid(...queryStatusValues).optional().default('drafted'),
  created_by: Joi.string().allow(null, '').optional(),
})

export const listQuerySchema = Joi.object({
  pageNumber: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().allow('').optional(),
  status: Joi.string().valid(...queryStatusValues).allow('').optional(),
})

export const getQueryByIdSchema = Joi.object({
  queryId: Joi.string().required(),
})

export const updateQuerySchema = Joi.object({
  queryId: Joi.string().required(),
  companyInfo: companyInfoSchema.optional(),
  industry_id: Joi.string().allow(null, '').optional(),
  products: Joi.array().items(productItemSchema).optional(),
  status: Joi.string().valid(...queryStatusValues).optional(),
})

export const listQueryActivitiesSchema = Joi.object({
  queryId: Joi.string().required(),
  pageNumber: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(10),
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

export const convertQueryToQuotationSchema = Joi.object({
  queryCode: Joi.string().required(),
})
