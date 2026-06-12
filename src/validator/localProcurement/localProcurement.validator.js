import Joi from 'joi'
import { LOCAL_PROCUREMENT_STATUS } from '../../models/localProcurement.model.js'

const statusValues = Object.values(LOCAL_PROCUREMENT_STATUS)

export const assignLocalProcurementSchema = Joi.object({
  queryProductId: Joi.string().required(),
  employeeId: Joi.string().required(),
  remark: Joi.string().allow('', null).optional(),
})

export const listLocalProcurementsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  pageNumber: Joi.number().integer().min(1).optional(),
  pageSize: Joi.number().integer().min(1).max(100).default(20),
  limit: Joi.number().integer().min(1).max(100).optional(),
  status: Joi.string()
    .valid(...statusValues)
    .allow('', null)
    .optional(),
  from: Joi.alternatives()
    .try(Joi.date(), Joi.string())
    .allow('', null)
    .optional(),
  to: Joi.alternatives()
    .try(Joi.date(), Joi.string())
    .allow('', null)
    .optional(),
  assignedTo: Joi.string().allow('', null).optional(),
  employeeId: Joi.string().allow('', null).optional(),
})

export const submitLocalProcurementParamSchema = Joi.object({
  id: Joi.string().required(),
})

const imageItemSchema = Joi.object({
  documentId: Joi.string().required(),
}).unknown(true)

export const submitLocalProcurementBodySchema = Joi.object({
  supplier: Joi.string().trim().min(1).required(),
  price: Joi.number().min(0).optional(),
  rate: Joi.number().min(0).required(),
  unit: Joi.string().allow('', null).optional(),
  remark: Joi.string().allow('', null).optional(),
  images: Joi.array().items(imageItemSchema).optional().default([]),
})
