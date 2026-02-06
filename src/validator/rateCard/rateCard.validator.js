import Joi from 'joi'

export const createRateCardSchema = Joi.object({
  name: Joi.string().required().min(2).max(100),
  description: Joi.string().optional().allow(''),
  type: Joi.string().valid('fixed', 'percentage', 'tiered').default('fixed'),
  value: Joi.number().min(0).default(0),
  minOrderValue: Joi.number().min(0).default(0),
  maxDiscount: Joi.number().min(0).default(0),
  validFrom: Joi.date().optional().allow(null),
  validTo: Joi.date().optional().allow(null),
  applicableCategories: Joi.array().items(Joi.string()).optional().default([]),
  applicableProducts: Joi.array().items(Joi.string()).optional().default([]),
  status: Joi.string().valid('active', 'inactive', 'expired').default('active'),
  priority: Joi.number().integer().default(0),
})

export const listRateCardSchema = Joi.object({
  pageNumber: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().allow('', null),
  status: Joi.string().valid('active', 'inactive', 'expired').allow('', null),
})

export const searchRateCardSchema = Joi.object({
  search: Joi.string().allow('', null).default(''),
  limit: Joi.number().integer().min(1).max(20).default(5),
})

export const getRateCardByIdSchema = Joi.object({
  rateCardId: Joi.string().required(),
})

export const updateRateCardSchema = Joi.object({
  rateCardId: Joi.string().required(),
  name: Joi.string().min(2).max(100).optional(),
  description: Joi.string().optional().allow(''),
  type: Joi.string().valid('fixed', 'percentage', 'tiered').optional(),
  value: Joi.number().min(0).optional(),
  minOrderValue: Joi.number().min(0).optional(),
  maxDiscount: Joi.number().min(0).optional(),
  validFrom: Joi.date().optional().allow(null),
  validTo: Joi.date().optional().allow(null),
  applicableCategories: Joi.array().items(Joi.string()).optional(),
  applicableProducts: Joi.array().items(Joi.string()).optional(),
  status: Joi.string().valid('active', 'inactive', 'expired').optional(),
  priority: Joi.number().integer().optional(),
})

export const deleteRateCardSchema = Joi.object({
  rateCardId: Joi.string().required(),
})

export const addSupplierSchema = Joi.object({
  rateCardId: Joi.string().required(),
  supplierName: Joi.string().required().min(1).max(200).trim(),
  rate: Joi.number().min(0).required(),
  contact: Joi.string().required().min(1).max(50).trim(),
  notes: Joi.string().optional().allow(''),
})

export const updateSupplierSchema = Joi.object({
  rateCardId: Joi.string().required(),
  supplierId: Joi.string().required(),
  supplierName: Joi.string().min(1).max(200).trim().optional(),
  rate: Joi.number().min(0).optional(),
  contact: Joi.string().min(1).max(50).trim().optional(),
  notes: Joi.string().optional().allow(''),
})

export const deleteSupplierSchema = Joi.object({
  rateCardId: Joi.string().required(),
  supplierId: Joi.string().required(),
})
