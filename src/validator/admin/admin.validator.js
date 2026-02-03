import Joi from 'joi'

export const createAdminSchema = Joi.object({
  name: Joi.string().required().min(2).max(50),
  email: Joi.string().email().required(),
  password: Joi.string().required().min(6),
})

export const updateAdminSchema = Joi.object({
  adminId: Joi.string().required().messages({
    'string.empty': 'Admin ID is required',
    'any.required': 'Admin ID is required',
  }),
  name: Joi.string().min(2).max(50).optional(),
  email: Joi.string().email().optional(),
  password: Joi.string().min(6).optional(),
})

export const loginAdminSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
})

export const loginSuperAdminSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
})

export const listAdminSchema = Joi.object({
  pageNumber: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(10),
})

export const deleteAdminSchema = Joi.object({
  adminId: Joi.string().required().messages({
    'string.empty': 'Admin ID is required',
    'any.required': 'Admin ID is required',
  }),
})

export const updateAdminAccessSchema = Joi.object({
  adminId: Joi.string().required().messages({
    'string.empty': 'Admin ID is required',
    'any.required': 'Admin ID is required',
  }),
  access: Joi.array().items(Joi.string()).min(1).required().messages({
    'array.min': 'At least one access permission is required',
    'any.required': 'Access array is required',
  }),
})

export const getAdminByIdSchema = Joi.object({
  adminId: Joi.string().required().messages({
    'string.empty': 'Admin ID is required',
    'any.required': 'Admin ID is required',
  }),
})
