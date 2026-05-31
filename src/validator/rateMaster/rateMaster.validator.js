import Joi from 'joi'
import { RATE_MASTER_TYPE } from '../../models/rateMaster.model.js'

const typeValues = Object.values(RATE_MASTER_TYPE)

export const rateMasterSummarySchema = Joi.object({
  productCode: Joi.string().trim().required(),
})

export const rateMasterListSchema = Joi.object({
  productCode: Joi.string().trim().required(),
  type: Joi.string()
    .trim()
    .lowercase()
    .valid(...typeValues)
    .optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(25),
})

export const rateMasterSearchCodesSchema = Joi.object({
  search: Joi.string().trim().allow('', null).default(''),
  limit: Joi.number().integer().min(1).max(50).default(10),
})
