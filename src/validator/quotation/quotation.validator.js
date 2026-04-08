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
  applyDiscount: Joi.boolean().optional().default(false),
  discountPercentage: Joi.number().min(0).max(100).allow(null).optional(),
  discountAmount: Joi.number().min(0).allow(null).optional(),
  notAvailable: Joi.boolean().optional().default(false),
  notAvailableRemark: Joi.string().allow('').optional(),
})

const quotationStatusValues = Object.values(QUOTATION_STATUS)

const dateOnlySchema = Joi.string()
  .pattern(/^\d{4}-\d{2}-\d{2}$/)
  .messages({ 'string.pattern.base': 'Date must be YYYY-MM-DD' })

export const listQuotationSchema = Joi.object({
  pageNumber: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().allow('').optional(),
  status: Joi.string()
    .valid(...quotationStatusValues, 'drafted', 'hod approved', 'hod-approved')
    .allow('')
    .optional(),
  dateFrom: Joi.alternatives().try(Joi.string().valid(''), dateOnlySchema).optional(),
  dateTo: Joi.alternatives().try(Joi.string().valid(''), dateOnlySchema).optional(),
  industryId: Joi.string()
    .pattern(objectIdPattern)
    .optional()
    .messages({ 'string.pattern.base': 'industryId must be a valid Mongo ObjectId' }),
  includeTotalAmountSum: Joi.alternatives()
    .try(Joi.boolean(), Joi.string().valid('true', 'false', '1', '0'))
    .optional(),
})

export const listQuotationsByIndustrySchema = Joi.object({
  industryId: Joi.string()
    .pattern(objectIdPattern)
    .required()
    .messages({ 'string.pattern.base': 'industryId must be a valid Mongo ObjectId' }),
  pageNumber: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(10),
  status: Joi.string()
    .valid(...quotationStatusValues, 'drafted', 'hod approved', 'hod-approved')
    .allow('')
    .optional(),
  includeTotalAmountSum: Joi.alternatives()
    .try(Joi.boolean(), Joi.string().valid('true', 'false', '1', '0'))
    .optional(),
})

export const getQuotationByIdSchema = Joi.object({
  quotationId: Joi.string()
    .pattern(objectIdPattern)
    .required()
    .messages({
      'string.pattern.base': 'quotationId must be a valid Mongo ObjectId',
    }),
})

export const deleteQuotationSchema = getQuotationByIdSchema

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
  freightCharge: Joi.any()
    .optional()
    .custom((v) => {
      if (v === undefined) return undefined
      if (v == null || v === '') return ''
      return String(v).trim()
    }),
  packingCharge: Joi.number().min(0).optional(),
  expectedDeliveryDate: Joi.date().allow(null).optional(),
  expectedDeliveryWithinDays: Joi.number().integer().min(0).allow(null).optional(),
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
