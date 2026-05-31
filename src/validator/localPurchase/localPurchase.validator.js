import Joi from 'joi'
import { LOCAL_PURCHASE_STATUS } from '../../models/localPurchase.model.js'

const statusValues = Object.values(LOCAL_PURCHASE_STATUS)

export const assignLocalPurchaseSchema = Joi.object({
  poProductId: Joi.string().required(),
  employeeId: Joi.string().required(),
  remark: Joi.string().allow('', null).optional(),
  supplier: Joi.string().allow('', null).optional(),
  locationLink: Joi.string().allow('', null).optional(),
})

export const getLocalPurchaseByIdSchema = Joi.object({
  id: Joi.string().required(),
})

export const listLocalPurchasesSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  pageNumber: Joi.number().integer().min(1).optional(),
  pageSize: Joi.number().integer().min(1).max(100).default(20),
  limit: Joi.number().integer().min(1).max(100).optional(),
  poProductId: Joi.string().allow('', null).optional(),
  status: Joi.string()
    .valid(...statusValues)
    .allow('', null)
    .optional(),
  employeeId: Joi.string().allow('', null).optional(),
  assignedTo: Joi.string().allow('', null).optional(),
})

export const submitLocalPurchaseParamSchema = Joi.object({
  id: Joi.string().required(),
})

const documentItemSchema = Joi.object({
  documentId: Joi.string().required(),
}).unknown(true)

export const submitLocalPurchaseBodySchema = Joi.object({
  billDocumentId: Joi.string().allow('', null).optional(),
  productImages: Joi.array().items(documentItemSchema).optional().default([]),
  remark: Joi.string().allow('', null).optional(),
})

export const updateLocalPurchaseAttachmentsParamSchema = Joi.object({
  id: Joi.string().required(),
})

export const updateLocalPurchaseAttachmentsBodySchema = Joi.object({
  billDocumentId: Joi.string().allow('', null).optional(),
  productImages: Joi.array().items(documentItemSchema).optional().default([]),
}).custom((value, helpers) => {
  const hasBill =
    value.billDocumentId != null && String(value.billDocumentId).trim() !== ''
  const hasImages =
    Array.isArray(value.productImages) && value.productImages.length > 0
  if (!hasBill && !hasImages) {
    return helpers.error('any.custom', {
      message: 'Provide a bill and/or at least one product image to update',
    })
  }
  return value
})
