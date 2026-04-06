import Joi from 'joi'

const objectIdPattern = /^[0-9a-fA-F]{24}$/

export const createVisitSchema = Joi.object({
  branchId: Joi.string().pattern(objectIdPattern).optional(),
  zoneId: Joi.string().pattern(objectIdPattern).required(),
  employeeId: Joi.string().pattern(objectIdPattern).required(),
  industryIds: Joi.array().items(Joi.string().pattern(objectIdPattern)).min(1).required(),
  instructions: Joi.string().allow('').optional(),
  status: Joi.string().valid('active', 'completed').optional(),
})

export const listVisitSchema = Joi.object({
  pageNumber: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(10),
  branchId: Joi.string().pattern(objectIdPattern).allow('', null).optional(),
  period: Joi.string().valid('all', 'daily', 'weekly', 'monthly').default('all'),
  dateFrom: Joi.string().allow('').optional(),
  dateTo: Joi.string().allow('').optional(),
  status: Joi.string().valid('active', 'completed').allow('', null).optional(),
})

export const completeVisitWithRemarkSchema = Joi.object({
  visitId: Joi.string().pattern(objectIdPattern).required(),
  remark: Joi.string().trim().required(),
})
