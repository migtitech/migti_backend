import Joi from 'joi'

// Indian GSTIN: 15 chars - 2 digit state + 5 letter + 4 digit + 1 letter (PAN) + 1 entity + Z + 1 checksum
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/
const gstNumberRule = Joi.string()
  .trim()
  .uppercase()
  .required()
  .pattern(GSTIN_REGEX)
  .messages({
    'string.pattern.base': 'GST number must be valid 15-character GSTIN (e.g. 22AABCU9603R1ZX)',
  })

export const createCompanyBranchSchema = Joi.object({
  name: Joi.string().required().min(2).max(100),
  companyId: Joi.string().required(),
  adminId: Joi.string().optional(),
  email: Joi.string().email().required(),
  location: Joi.string().optional().allow('').max(200),
  branchcode: Joi.string().required().min(1).max(50),
  phone: Joi.string()
    .pattern(/^\d{5,20}$/)
    .required()
    .messages({
      'string.pattern.base': 'phone must contain only digits',
    }),
  address: Joi.string().required().min(2).max(200),
  gstNumber: gstNumberRule,
  fullAddress: Joi.string().required().min(5).max(500),
  mapLocationUrl: Joi.string().optional().empty('').uri().max(500),
})

export const listCompanyBranchSchema = Joi.object({
  pageNumber: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(10),
  companyId: Joi.string().allow('', null),
})

export const getCompanyBranchByIdSchema = Joi.object({
  companyBranchId: Joi.string().required().min(1),
})

export const updateCompanyBranchSchema = Joi.object({
  companyBranchId: Joi.string().required(),
  name: Joi.string().min(2).max(100).optional(),
  companyId: Joi.string().optional(),
  adminId: Joi.string().optional(),
  email: Joi.string().email().optional(),
  location: Joi.string().optional().allow('').max(200),
  branchcode: Joi.string().min(1).max(50).optional(),
  phone: Joi.string()
    .pattern(/^\d{5,20}$/)
    .optional()
    .messages({
      'string.pattern.base': 'phone must contain only digits',
    }),
  address: Joi.string().min(2).max(200).optional(),
  gstNumber: Joi.string()
    .trim()
    .uppercase()
    .optional()
    .allow('')
    .pattern(/^(|[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z])$/)
    .messages({
      'string.pattern.base': 'GST number must be valid 15-character GSTIN (e.g. 22AABCU9603R1ZX)',
    }),
  fullAddress: Joi.string().min(5).max(500).optional(),
  mapLocationUrl: Joi.string().optional().empty('').uri().max(500),
})

export const deleteCompanyBranchSchema = Joi.object({
  companyBranchId: Joi.string().required(),
})
