import Joi from 'joi'
import { PURCHASE_ORDER_STATUS } from '../../models/purchaseOrder.model.js'

const objectIdPattern = /^[0-9a-fA-F]{24}$/

const purchaseManagerSchema = Joi.object({
  name: Joi.string().allow('').optional(),
  phone: Joi.string().allow('').optional(),
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .allow('')
    .optional(),
})

const companyInfoSchema = Joi.object({
  name: Joi.string().allow('').optional(),
  area: Joi.string().allow('').optional(),
  location: Joi.string().allow('').optional(),
  address: Joi.string().allow('').optional(),
  purchaseManagers: Joi.array()
    .items(purchaseManagerSchema)
    .optional()
    .default([]),
})

const productVariantSchema = Joi.object({
  _id: Joi.string().optional(),
  variantName: Joi.string().allow('').optional(),
})

const purchaseOrderProductItemSchema = Joi.object({
  productName: Joi.string().required().trim(),
  description: Joi.string().allow('').optional(),
  quantity: Joi.number().integer().min(0).required(),
  unit: Joi.string().allow('').optional(),
  hsnNumber: Joi.string().allow('').optional(),
  modelNumber: Joi.string().allow('').optional(),
  rawProductCode: Joi.string().allow('').optional(),
  dispatchmentDate: Joi.date().allow(null).optional(),
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
  priority: Joi.string()
    .valid('high', 'medium', 'low')
    .optional()
    .default('medium'),
})

const purchaseOrderStatusValues = Object.values(PURCHASE_ORDER_STATUS)

export const listPurchaseOrderSchema = Joi.object({
  pageNumber: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().allow('').optional(),
  status: Joi.string()
    .valid(...purchaseOrderStatusValues)
    .allow('')
    .optional(),
})

export const getPurchaseOrderByIdSchema = Joi.object({
  purchaseOrderId: Joi.string().pattern(objectIdPattern).required().messages({
    'string.pattern.base': 'purchaseOrderId must be a valid Mongo ObjectId',
  }),
})

/** List `po_products` line rows: pass Mongo `purchaseOrderId` and/or `poCode` (PO number). */
export const listPoProductLinesSchema = Joi.object({
  purchaseOrderId: Joi.string().pattern(objectIdPattern).optional().messages({
    'string.pattern.base': 'purchaseOrderId must be a valid Mongo ObjectId',
  }),
  poCode: Joi.string().trim().min(1).optional(),
})
  .or('purchaseOrderId', 'poCode')
  .messages({
    'object.missing': 'Either purchaseOrderId or poCode is required',
  })

export const getPurchaseOrderByQuotationIdSchema = Joi.object({
  quotationId: Joi.string().pattern(objectIdPattern).required().messages({
    'string.pattern.base': 'quotationId must be a valid Mongo ObjectId',
  }),
})

export const createPurchaseOrderFromQuotationSchema = Joi.object({
  quotationId: Joi.string().pattern(objectIdPattern).required().messages({
    'string.pattern.base': 'quotationId must be a valid Mongo ObjectId',
  }),
  reuseExisting: Joi.boolean().optional().default(true),
})

export const updatePurchaseOrderSchema = Joi.object({
  purchaseOrderId: Joi.string().pattern(objectIdPattern).required().messages({
    'string.pattern.base': 'purchaseOrderId must be a valid Mongo ObjectId',
  }),
  companyInfo: companyInfoSchema.optional(),
  industry_id: Joi.string().allow(null, '').optional(),
  products: Joi.array().items(purchaseOrderProductItemSchema).optional(),
  freightCharge: Joi.number().min(0).optional(),
  packingCharge: Joi.number().min(0).optional(),
  expectedDeliveryDate: Joi.date().allow(null).optional(),
  expectedDeliveryWithinDays: Joi.number()
    .integer()
    .min(0)
    .allow(null)
    .optional(),
  remark: Joi.string().allow('').optional(),
  salesEmployeeId: Joi.string().allow(null, '').optional(),
  attachmentDocumentId: Joi.alternatives()
    .try(
      Joi.string().pattern(objectIdPattern),
      Joi.string().valid(''),
      Joi.valid(null)
    )
    .optional(),
})

export const appendPurchaseOrderPaymentSchema = Joi.object({
  purchaseOrderId: Joi.string().pattern(objectIdPattern).required().messages({
    'string.pattern.base': 'purchaseOrderId must be a valid Mongo ObjectId',
  }),
  amount: Joi.number().positive().required(),
  paidAt: Joi.date().optional(),
  remark: Joi.string().allow('').optional(),
})

export const updatePurchaseOrderStatusSchema = Joi.object({
  purchaseOrderId: Joi.string().pattern(objectIdPattern).required().messages({
    'string.pattern.base': 'purchaseOrderId must be a valid Mongo ObjectId',
  }),
  status: Joi.string()
    .valid(...purchaseOrderStatusValues)
    .required(),
})
