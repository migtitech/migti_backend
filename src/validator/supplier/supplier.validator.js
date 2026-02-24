import Joi from 'joi'

// Indian GSTIN: 15 chars - 2 digit state + 5 letter + 4 digit + 1 letter (PAN) + 1 entity + Z + 1 checksum
const GSTIN_REGEX = /^(|[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z])$/
const gstRule = Joi.string()
  .trim()
  .uppercase()
  .optional()
  .allow('')
  .pattern(GSTIN_REGEX)
  .messages({
    'string.pattern.base':
      'GST number must be valid 15-character GSTIN (e.g. 22AABCU9603R1ZX)',
  })

export const createSupplierSchema = Joi.object({
  name: Joi.string().required().min(2).max(100),
  shopname: Joi.string().optional().allow(''),
  address: Joi.string().optional().allow(''),
  shippingAddress: Joi.string().optional().allow(''),
  billingAddress: Joi.string().optional().allow(''),
  phone_1: Joi.string().optional().allow(''),
  phone_2: Joi.string().optional().allow(''),
  email: Joi.string().email({ tlds: { allow: false } }).optional().allow(''),
  other_contact: Joi.string().optional().allow(''),
  label: Joi.string().optional().allow(''),
  labal: Joi.string().optional().allow(''),
  shop_location: Joi.string().optional().allow(''),
  gst: gstRule,
  categories: Joi.array().items(Joi.string()).optional().default([]),
  remark: Joi.string().optional().allow(''),
})

export const listSupplierSchema = Joi.object({
  pageNumber: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().allow('', null),
  category: Joi.string().allow('', null),
  subcategory: Joi.string().allow('', null),
  area: Joi.string().allow('', null),
})

export const searchSupplierSchema = Joi.object({
  search: Joi.string().allow('', null).default(''),
  limit: Joi.number().integer().min(1).max(20).default(5),
})

export const getSupplierByIdSchema = Joi.object({
  supplierId: Joi.string().required(),
})

// Edit mode: only address, shipping, billing, mobile numbers, categories and remark can be updated
export const updateSupplierSchema = Joi.object({
  supplierId: Joi.string().required(),
  address: Joi.string().optional().allow(''),
  shippingAddress: Joi.string().optional().allow(''),
  billingAddress: Joi.string().optional().allow(''),
  phone_1: Joi.string().optional().allow(''),
  phone_2: Joi.string().optional().allow(''),
  categories: Joi.array().items(Joi.string()).optional(),
  remark: Joi.string().optional().allow(''),
})

export const deleteSupplierSchema = Joi.object({
  supplierId: Joi.string().required(),
})

export const uploadCatalogSchema = Joi.object({
  supplierId: Joi.string().required(),
})
