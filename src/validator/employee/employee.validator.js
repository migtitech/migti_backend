import Joi from 'joi'

export const createEmployeeSchema = Joi.object({
  name: Joi.string().required().min(2).max(100),
  email: Joi.string().email().required(),
  phone: Joi.string()
    .pattern(/^\d{5,20}$/)
    .required()
    .messages({
      'string.pattern.base': 'phone must contain only digits',
    }),
  role: Joi.string().required().min(2).max(50),
  designation: Joi.string().required().min(2).max(100),
  address: Joi.string().required().min(2).max(500),
  idnumber: Joi.string().required().min(2).max(50),
  password: Joi.string().required().min(6),
  branchId: Joi.string().required(),
})

export const listEmployeeSchema = Joi.object({
  pageNumber: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(10),
})

export const getEmployeeByIdSchema = Joi.object({
  employeeId: Joi.string().required(),
})

export const updateEmployeeSchema = Joi.object({
  employeeId: Joi.string().required(),
  name: Joi.string().min(2).max(100).optional(),
  email: Joi.string().email().optional(),
  phone: Joi.string()
    .pattern(/^\d{5,20}$/)
    .optional()
    .messages({
      'string.pattern.base': 'phone must contain only digits',
    }),
  role: Joi.string().min(2).max(50).optional(),
  designation: Joi.string().min(2).max(100).optional(),
  address: Joi.string().min(2).max(500).optional(),
  idnumber: Joi.string().min(2).max(50).optional(),
  password: Joi.string().min(6).optional(),
  branchId: Joi.string().optional(),
})

export const deleteEmployeeSchema = Joi.object({
  employeeId: Joi.string().required(),
})

export const loginEmployeeSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  role: Joi.string()
    .valid('sales', 'hod', 'purchase', 'finance', 'delivery')
    .required(),
})
