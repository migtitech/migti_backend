import Joi from 'joi'

export const upsertRateSchema = Joi.object({
  productId: Joi.string().required(),
  supplierId: Joi.string().required(),
  rate: Joi.number().min(0).required(),
  notes: Joi.string().optional().allow(''),
  combinationUniqueId: Joi.string().optional().allow('', null),
})

export const getByProductSchema = Joi.object({
  productId: Joi.string().required(),
  combinationUniqueId: Joi.string().optional().allow('', null),
})

export const getBySupplierSchema = Joi.object({
  supplierId: Joi.string().required(),
})

export const deleteRateCardSchema = Joi.object({
  rateCardId: Joi.string().optional(),
  rateCombinationId: Joi.string().optional(),
}).or('rateCardId', 'rateCombinationId')

export const searchProductsSchema = Joi.object({
  search: Joi.string().allow('', null).default(''),
  limit: Joi.number().integer().min(1).max(50).default(10),
})

export const searchSuppliersSchema = Joi.object({
  search: Joi.string().allow('', null).default(''),
  limit: Joi.number().integer().min(1).max(50).default(10),
})
