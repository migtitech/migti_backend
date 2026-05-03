import Joi from 'joi'

const purchaseManagerItemSchema = Joi.object({
  name: Joi.string().required().min(1).max(100),
  phone: Joi.string().optional().allow('').max(20),
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .optional()
    .allow(''),
})

export const createIndustrySchema = Joi.object({
  name: Joi.string().required().min(2).max(100),
  category: Joi.string().valid('A', 'B', 'C', 'D').optional().allow('', null),
  area: Joi.string().optional().allow(null, ''),
  subZoneId: Joi.string()
    .pattern(/^[a-fA-F0-9]{24}$/)
    .allow('', null)
    .optional(),
  location: Joi.string().optional().allow(''),
  address: Joi.string().optional().allow(''),
  purchase_manager_name: Joi.string().optional().allow('', null),
  purchase_manager_phone: Joi.string().optional().allow('', null),
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .optional()
    .allow('', null),
  gstNumber: Joi.string()
    .trim()
    .uppercase()
    .required()
    .pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/)
    .messages({
      'any.required': 'GST number is required',
      'string.empty': 'GST number is required',
      'string.pattern.base':
        'GST number must be valid 15-character GSTIN (e.g. 22AABCU9603R1ZX)',
    }),
  purchaseManagers: Joi.array()
    .items(purchaseManagerItemSchema)
    .optional()
    .default([]),
  branchId: Joi.string().optional().allow('', null),
})

export const listIndustrySchema = Joi.object({
  pageNumber: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(1000).default(10),
  search: Joi.string().allow('', null),
  category: Joi.string().valid('A', 'B', 'C', 'D').optional().allow('', null),
  areaIds: Joi.string().allow('', null).optional(),
  branchId: Joi.string().optional().allow('', null),
})

export const getIndustryByIdSchema = Joi.object({
  industryId: Joi.string().required(),
})

const gstNumberUpdateRule = Joi.string()
  .trim()
  .uppercase()
  .pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/)
  .messages({
    'string.pattern.base':
      'GST number must be valid 15-character GSTIN (e.g. 22AABCU9603R1ZX)',
  })
  .optional()

// Edit mode: location, address, GST, purchase manager(s), and branch can be updated
export const updateIndustrySchema = Joi.object({
  industryId: Joi.string().required(),
  gstNumber: gstNumberUpdateRule,
  area: Joi.string()
    .pattern(/^[a-fA-F0-9]{24}$/)
    .allow('', null)
    .optional(),
  subZoneId: Joi.string()
    .pattern(/^[a-fA-F0-9]{24}$/)
    .allow('', null)
    .optional(),
  location: Joi.string().optional().allow(''),
  address: Joi.string().optional().allow(''),
  purchase_manager_name: Joi.string().optional().allow('', null),
  purchase_manager_phone: Joi.string().optional().allow('', null),
  purchaseManagers: Joi.array().items(purchaseManagerItemSchema).optional(),
  branchId: Joi.string().optional().allow('', null),
})

export const deleteIndustrySchema = Joi.object({
  industryId: Joi.string().required(),
})
