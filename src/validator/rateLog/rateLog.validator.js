import Joi from 'joi'

export const listRateLogsSchema = Joi.object({
  pageNumber: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().allow('').optional(),
  industryName: Joi.string().allow('').optional(),
})
