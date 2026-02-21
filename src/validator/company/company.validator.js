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
    'string.pattern.base': 'GST number must be valid 15-character GSTIN (e.g. 22AABCU9603R1ZX)',
  })

export const createCompanySchema = Joi.object({
  name: Joi.string().required().min(2).max(100),
  logoUrl: Joi.string().uri().optional().allow(''),
  email: Joi.string().email().required(),
  brandName: Joi.string().required().min(2).max(100),
  gst: gstRule,
  mobile: Joi.string().optional().allow('').max(20),
  address: Joi.string().optional().allow('').max(500),
  shippingAddress: Joi.string().optional().allow('').max(500),
  billingAddress: Joi.string().optional().allow('').max(500),
  website: Joi.string().uri().optional().allow('').max(200),
  isActive: Joi.boolean().optional(),
})

export const listCompanySchema = Joi.object({
  pageNumber: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().allow('', null),
})

export const getCompanyByIdSchema = Joi.object({
  companyId: Joi.string().required(),
})

export const updateCompanySchema = Joi.object({
  companyId: Joi.string().required(),
  name: Joi.string().min(2).max(100).optional(),
  logoUrl: Joi.string().uri().optional().allow(''),
  email: Joi.string().email().optional(),
  brandName: Joi.string().min(2).max(100).optional(),
  gst: gstRule,
  mobile: Joi.string().optional().allow('').max(20),
  address: Joi.string().optional().allow('').max(500),
  shippingAddress: Joi.string().optional().allow('').max(500),
  billingAddress: Joi.string().optional().allow('').max(500),
  website: Joi.string().uri().optional().allow('').max(200),
  isActive: Joi.boolean().optional(),
})

export const deleteCompanySchema = Joi.object({
  companyId: Joi.string().required(),
})
