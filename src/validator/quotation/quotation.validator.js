import Joi from 'joi'
import { QUOTATION_STATUS } from '../../models/quotation.model.js'

// Shared ObjectId pattern to avoid Mongoose cast errors for invalid ids
const objectIdPattern = /^[0-9a-fA-F]{24}$/

const purchaseManagerSchema = Joi.object({
  name: Joi.string().allow('').optional(),
  phone: Joi.string().allow('').optional(),
  email: Joi.string().email({ tlds: { allow: false } }).allow('').optional(),
})

const companyInfoSchema = Joi.object({
  name: Joi.string().allow('').optional(),
  area: Joi.string().allow('').optional(),
  location: Joi.string().allow('').optional(),
  address: Joi.string().allow('').optional(),
  purchaseManagers: Joi.array().items(purchaseManagerSchema).optional().default([]),
})

const productVariantSchema = Joi.object({
  _id: Joi.string().optional(), // MongoDB subdoc _id when variants are loaded from DB
  variantName: Joi.string().allow('').optional(),
})

const quotationProductItemSchema = Joi.object({
  productName: Joi.string().required().trim(),
  description: Joi.string().allow('').optional(),
  quantity: Joi.number().integer().min(0).required(),
  unit: Joi.string().allow('').optional(),
  hsnNumber: Joi.string().allow('').optional(),
  modelNumber: Joi.string().allow('').optional(),
  gstPercentage: Joi.number().min(0).max(100).allow(null).optional(),
  variants: Joi.array().items(productVariantSchema).optional().default([]),
  remark: Joi.string().allow('').optional(),
  product_id: Joi.string().allow(null, '').optional(),
  rate: Joi.number().min(0).allow(null).optional(),
  images: Joi.array().items(Joi.string()).optional().default([]),
})

const quotationStatusValues = Object.values(QUOTATION_STATUS)

export const listQuotationSchema = Joi.object({
  pageNumber: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().allow('').optional(),
  status: Joi.string().valid(...quotationStatusValues).allow('').optional(),
})

export const getQuotationByIdSchema = Joi.object({
  quotationId: Joi.string()
    .pattern(objectIdPattern)
    .required()
    .messages({
      'string.pattern.base': 'quotationId must be a valid Mongo ObjectId',
    }),
})

export const updateQuotationSchema = Joi.object({
  quotationId: Joi.string()
    .pattern(objectIdPattern)
    .required()
    .messages({
      'string.pattern.base': 'quotationId must be a valid Mongo ObjectId',
    }),
  companyInfo: companyInfoSchema.optional(),
  industry_id: Joi.string().allow(null, '').optional(),
  products: Joi.array().items(quotationProductItemSchema).optional(),
  freightCharge: Joi.number().min(0).optional(),
  packingCharge: Joi.number().min(0).optional(),
  expectedDeliveryDate: Joi.date().allow(null).optional(),
})

export const updateQuotationStatusSchema = Joi.object({
  quotationId: Joi.string()
    .pattern(objectIdPattern)
    .required()
    .messages({
      'string.pattern.base': 'quotationId must be a valid Mongo ObjectId',
    }),
  status: Joi.string().valid(...quotationStatusValues).required(),
})
