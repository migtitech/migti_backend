import Joi from 'joi'

const objectId = Joi.string().pattern(/^[a-fA-F0-9]{24}$/)

export const createCompanyDocumentSchema = Joi.object({
  name: Joi.string().trim().min(1).max(200).required(),
  doc_type: Joi.string().trim().min(1).max(100).required(),
  remark: Joi.string().trim().max(1000).allow('', null).optional(),
})

export const listCompanyDocumentSchema = Joi.object({
  pageNumber: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().trim().max(200).allow('', null).optional(),
  doc_type: Joi.string().trim().max(100).allow('', null).optional(),
})

export const deleteCompanyDocumentSchema = Joi.object({
  companyDocumentId: objectId.required(),
})
