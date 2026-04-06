import Joi from 'joi'

const objectIdPattern = /^[0-9a-fA-F]{24}$/

export const createPoEntrySchema = Joi.object({
  companyId: Joi.string().pattern(objectIdPattern).required(),
  salespersonId: Joi.string().pattern(objectIdPattern).required(),
  amount: Joi.number().min(0).required(),
  entryDate: Joi.date().optional(),
  remark: Joi.string().allow('').optional(),
  branchId: Joi.string().pattern(objectIdPattern).optional(),
})

export const createBillingEntrySchema = Joi.object({
  companyId: Joi.string().pattern(objectIdPattern).required(),
  salespersonId: Joi.string().pattern(objectIdPattern).required(),
  amount: Joi.number().min(0).required(),
  entryDate: Joi.date().optional(),
  remark: Joi.string().allow('').optional(),
  branchId: Joi.string().pattern(objectIdPattern).optional(),
})

export const poBillingAnalyticsSchema = Joi.object({
  period: Joi.string().valid('all', 'daily', 'weekly', 'monthly').default('all'),
  dateFrom: Joi.string().allow('').optional(),
  dateTo: Joi.string().allow('').optional(),
  tab: Joi.string().valid('po', 'billing').default('po'),
  pageNumber: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(10),
})
