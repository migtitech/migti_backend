import Joi from 'joi'

const objectIdPattern = /^[0-9a-fA-F]{24}$/

export const listPurchaseBillingRequestsSchema = Joi.object({
  pageNumber: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(20),
  poCode: Joi.string().allow('').optional(),
  dateFrom: Joi.string().allow('').optional(),
  dateTo: Joi.string().allow('').optional(),
})

export const idParamSchema = Joi.object({
  id: Joi.string().pattern(objectIdPattern).required(),
})

export const updateRemarkBodySchema = Joi.object({
  statusRemark: Joi.string().allow('').optional().default(''),
})

export const approveBodySchema = Joi.object({
  statusRemark: Joi.string().allow('').optional(),
})
