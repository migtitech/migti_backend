import Joi from 'joi'

const assetItemSchema = Joi.object({
  enabled: Joi.boolean().optional(),
  model: Joi.string().allow('').optional(),
  modelNumber: Joi.string().allow('').optional(),
  companyName: Joi.string().allow('').optional(),
  vehicleNumber: Joi.string().allow('').optional(),
  configurationRam: Joi.string().allow('').optional(),
  configurationRom: Joi.string().allow('').optional(),
  storageType: Joi.string().allow('').optional(),
  phoneType: Joi.string().allow('').optional(),
  imeiNumber: Joi.string().allow('').optional(),
  number: Joi.string().allow('').optional(),
  providedDate: Joi.string().allow('').optional(),
}).unknown(true)

const bankDetailsSchema = Joi.object({
  accountNumber: Joi.string().allow('').optional(),
  ifscCode: Joi.string().allow('').optional(),
  bankName: Joi.string().allow('').optional(),
  accountHolderName: Joi.string().allow('').optional(),
  upiDetails: Joi.string().allow('').optional(),
}).unknown(true)

const assetsSchema = Joi.object({
  bike: assetItemSchema.optional(),
  laptop: assetItemSchema.optional(),
  mobile: assetItemSchema.optional(),
  simCard: assetItemSchema.optional(),
}).unknown(true)

export const createEmployeeSchema = Joi.object({
  name: Joi.string().required().min(2).max(100),
  email: Joi.string().email().required(),
  phone: Joi.string()
    .pattern(/^\d{5,20}$/)
    .required()
    .messages({
      'string.pattern.base': 'phone must contain only digits',
    }),
  fatherName: Joi.string().allow('').max(100).optional(),
  motherName: Joi.string().allow('').max(100).optional(),
  pincode: Joi.string().allow('').max(20).optional(),
  hasBike: Joi.string().allow('yes', 'no', '').optional(),
  hasDrivingLicense: Joi.string().allow('yes', 'no', '').optional(),
  companyEmail: Joi.string().email().allow('').optional(),
  companyPhone: Joi.string()
    .pattern(/^\d{5,20}$/)
    .allow('')
    .optional()
    .messages({
      'string.pattern.base': 'companyPhone must contain only digits',
    }),
  role: Joi.string().required().min(2).max(50),
  designation: Joi.string().required().min(2).max(100),
  address: Joi.string().required().min(2).max(500),
  idnumber: Joi.string().required().min(2).max(50),
  salaryType: Joi.string().allow('').max(50).optional(),
  salary: Joi.number().min(0).optional(),
  password: Joi.string().required().min(6),
  branchId: Joi.string().required(),
  permissions: Joi.array().items(Joi.string()).optional(),
  bankDetails: bankDetailsSchema.optional(),
  assets: assetsSchema.optional(),
}).unknown(true)

export const listEmployeeSchema = Joi.object({
  pageNumber: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(10),
  branchId: Joi.string().optional().allow('', null),
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
  fatherName: Joi.string().allow('').max(100).optional(),
  motherName: Joi.string().allow('').max(100).optional(),
  pincode: Joi.string().allow('').max(20).optional(),
  hasBike: Joi.string().allow('yes', 'no', '').optional(),
  hasDrivingLicense: Joi.string().allow('yes', 'no', '').optional(),
  companyEmail: Joi.string().email().allow('').optional(),
  companyPhone: Joi.string()
    .pattern(/^\d{5,20}$/)
    .allow('')
    .optional()
    .messages({
      'string.pattern.base': 'companyPhone must contain only digits',
    }),
  role: Joi.string().min(2).max(50).optional(),
  designation: Joi.string().min(2).max(100).optional(),
  address: Joi.string().min(2).max(500).optional(),
  idnumber: Joi.string().min(2).max(50).optional(),
  salaryType: Joi.string().allow('').max(50).optional(),
  salary: Joi.number().min(0).optional(),
  password: Joi.forbidden(), // password cannot be updated via this endpoint
  branchId: Joi.string().optional(),
  permissions: Joi.array().items(Joi.string()).optional(),
  bankDetails: bankDetailsSchema.optional(),
  assets: assetsSchema.optional(),
}).unknown(true)

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
