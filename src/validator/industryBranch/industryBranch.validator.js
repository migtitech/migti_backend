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

export const createIndustryBranchSchema = Joi.object({
  industryId: Joi.string().required(),
  name: Joi.string().required().min(1).max(100),
  location: Joi.string().optional().allow('').max(200),
  address: Joi.string().optional().allow('').max(500),
  gst: gstRule,
})

export const listIndustryBranchSchema = Joi.object({
  pageNumber: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(10),
  industryId: Joi.string().optional().allow('', null),
  search: Joi.string().optional().allow('', null),
})

export const getIndustryBranchByIdSchema = Joi.object({
  industryBranchId: Joi.string().required(),
})

export const updateIndustryBranchSchema = Joi.object({
  industryBranchId: Joi.string().required(),
  industryId: Joi.string().optional(),
  name: Joi.string().min(1).max(100).optional(),
  location: Joi.string().optional().allow('').max(200),
  address: Joi.string().optional().allow('').max(500),
  gst: gstRule,
})

export const deleteIndustryBranchSchema = Joi.object({
  industryBranchId: Joi.string().required(),
})
