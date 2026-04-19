import Joi from 'joi'

const objectIdPattern = /^[0-9a-fA-F]{24}$/

export const createEmployeeLocationSchema = Joi.object({
  employeeId: Joi.string().pattern(objectIdPattern).optional(),
  latitude: Joi.number().required(),
  longitude: Joi.number().required(),
  city: Joi.string().allow('').optional(),
  locality: Joi.string().allow('').optional(),
  accuracyM: Joi.number().min(0).allow(null).optional(),
})

export const listEmployeeLocationSchema = Joi.object({
  pageNumber: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(10),
  employeeId: Joi.string().pattern(objectIdPattern).allow('', null).optional(),
})
