import Joi from 'joi'

export const listQuotationFollowupSchema = Joi.object({
  pageNumber: Joi.number().integer().min(1).optional(),
  pageSize: Joi.number().integer().min(1).max(100).optional(),
  followupStatus: Joi.string().allow('').optional(),
  quotationCode: Joi.string().allow('').optional(),
  companyName: Joi.string().allow('').optional(),
  overdue: Joi.alternatives().try(Joi.boolean(), Joi.string()).optional(),
  includeZoneSalesPersons: Joi.alternatives()
    .try(Joi.boolean(), Joi.string())
    .optional(),
})

export const updateQuotationFollowupRemarkSchema = Joi.object({
  followupId: Joi.string().required(),
  remark: Joi.string().trim().min(1).required(),
})
