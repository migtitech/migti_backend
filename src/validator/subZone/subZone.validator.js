import Joi from 'joi'

const objectId = Joi.string().pattern(/^[a-fA-F0-9]{24}$/)

export const createSubZoneSchema = Joi.object({
  zoneId: objectId.required(),
  name: Joi.string().trim().min(1).max(200).required(),
})

export const listSubZoneSchema = Joi.object({
  zoneId: objectId.required(),
  pageNumber: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(100),
})

export const listSubZoneGroupedSchema = Joi.object({})

export const updateSubZoneSchema = Joi.object({
  subZoneId: objectId.required(),
  name: Joi.string().trim().min(1).max(200).required(),
})

export const deleteSubZoneSchema = Joi.object({
  subZoneId: objectId.required(),
})
