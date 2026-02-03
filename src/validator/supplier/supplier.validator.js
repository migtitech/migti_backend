import Joi from 'joi'

export const createSupplierSchema = Joi.object({
  name: Joi.string().required().min(2).max(100),
  shopname: Joi.string().optional().allow(''),
  address: Joi.string().optional().allow(''),
  phone_1: Joi.string().optional().allow(''),
  phone_2: Joi.string().optional().allow(''),
  email: Joi.string().email({ tlds: { allow: false } }).optional().allow(''),
  other_contact: Joi.string().optional().allow(''),
  label: Joi.string().optional().allow(''),
  labal: Joi.string().optional().allow(''),
  shop_location: Joi.string().optional().allow(''),
  categories: Joi.array().items(Joi.string()).optional().default([]),
  remark: Joi.string().optional().allow(''),
})

export const listSupplierSchema = Joi.object({
  pageNumber: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().allow('', null),
  category: Joi.string().allow('', null),
})

export const searchSupplierSchema = Joi.object({
  search: Joi.string().allow('', null).default(''),
  limit: Joi.number().integer().min(1).max(20).default(5),
})

export const getSupplierByIdSchema = Joi.object({
  supplierId: Joi.string().required(),
})

export const updateSupplierSchema = Joi.object({
  supplierId: Joi.string().required(),
  name: Joi.string().min(2).max(100).optional(),
  shopname: Joi.string().optional().allow(''),
  address: Joi.string().optional().allow(''),
  phone_1: Joi.string().optional().allow(''),
  phone_2: Joi.string().optional().allow(''),
  email: Joi.string().email({ tlds: { allow: false } }).optional().allow(''),
  other_contact: Joi.string().optional().allow(''),
  label: Joi.string().optional().allow(''),
  labal: Joi.string().optional().allow(''),
  shop_location: Joi.string().optional().allow(''),
  categories: Joi.array().items(Joi.string()).optional(),
  remark: Joi.string().optional().allow(''),
})

export const deleteSupplierSchema = Joi.object({
  supplierId: Joi.string().required(),
})
