import Joi from 'joi'

export const createCompanyBranchSchema = Joi.object({
  name: Joi.string().required().min(2).max(100),
  companyId: Joi.string().required(),
  adminId: Joi.string().optional(),
  email: Joi.string().email().required(),
  location: Joi.string().required().min(2).max(200),
  branchcode: Joi.string().required().min(1).max(50),
  phone: Joi.string()
    .pattern(/^\d{5,20}$/)
    .required()
    .messages({
      'string.pattern.base': 'phone must contain only digits',
    }),
  address: Joi.string().required().min(2).max(200),
  gstNumber: Joi.string().required().min(3).max(50),
  fullAddress: Joi.string().required().min(5).max(500),
  officeImages: Joi.string().required().min(1).max(500),
})

export const listCompanyBranchSchema = Joi.object({
  pageNumber: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(10),
  companyId: Joi.string().allow('', null),
})

export const getCompanyBranchByIdSchema = Joi.object({
  companyBranchId: Joi.string().required(),
})

export const updateCompanyBranchSchema = Joi.object({
  companyBranchId: Joi.string().required(),
  name: Joi.string().min(2).max(100).optional(),
  companyId: Joi.string().optional(),
  adminId: Joi.string().optional(),
  email: Joi.string().email().optional(),
  location: Joi.string().min(2).max(200).optional(),
  branchcode: Joi.string().min(1).max(50).optional(),
  phone: Joi.string()
    .pattern(/^\d{5,20}$/)
    .optional()
    .messages({
      'string.pattern.base': 'phone must contain only digits',
    }),
  address: Joi.string().min(2).max(200).optional(),
  gstNumber: Joi.string().min(3).max(50).optional(),
  fullAddress: Joi.string().min(5).max(500).optional(),
  officeImages: Joi.string().min(1).max(500).optional(),
})

export const deleteCompanyBranchSchema = Joi.object({
  companyBranchId: Joi.string().required(),
})
