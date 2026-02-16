import Joi from 'joi'

const variantOptionValueJoi = Joi.object({
  variantName: Joi.string().required(),
  variantValue: Joi.string().required(),
})

const variantDimensionsJoi = Joi.object({
  length: Joi.number().min(0).optional().default(0),
  width: Joi.number().min(0).optional().default(0),
  height: Joi.number().min(0).optional().default(0),
})

const variantCombinationJoi = Joi.object({
  _id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
  uniqueId: Joi.string().optional(),
  optionValues: Joi.array().items(variantOptionValueJoi).min(1).required(),
  sku: Joi.string().required(),
  price: Joi.number().min(0).required(),
  mrp: Joi.number().min(0).optional().default(0),
  costPrice: Joi.number().min(0).optional().default(0),
  quantity: Joi.number().integer().min(0).optional().default(0),
  weight: Joi.number().min(0).optional().default(0),
  weightUnit: Joi.string().valid('g', 'kg', 'lb', 'oz').optional().default('g'),
  dimensions: variantDimensionsJoi.optional(),
  dimensionUnit: Joi.string().valid('cm', 'in', 'm').optional().default('cm'),
  images: Joi.array().items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/)).optional().default([]),
  modelNumber: Joi.string().allow('', null).optional().max(100).default(''),
  hsnNumber: Joi.string().allow('', null).optional().max(50).default(''),
  gstPercentage: Joi.number().min(0).max(100).allow(null).optional(),
  isActive: Joi.boolean().optional().default(true),
})

const variantJoi = Joi.object({
  name: Joi.string().required(),
  options: Joi.array().items(Joi.string()).min(1).required(),
})

const dimensionsJoi = Joi.object({
  length: Joi.number().min(0).optional().default(0),
  width: Joi.number().min(0).optional().default(0),
  height: Joi.number().min(0).optional().default(0),
})

export const createProductSchema = Joi.object({
  name: Joi.string().required().min(2).max(200),
  description: Joi.string().optional().allow(''),
  shortDescription: Joi.string().optional().allow(''),
  sku: Joi.string().required().min(1).max(50),
  category: Joi.string().required(),
  subcategory: Joi.string().optional().allow(null, ''),
  brand: Joi.string().optional().allow(null, ''),
  group: Joi.string().optional().allow(null, ''),
  hsnNumber: Joi.string().optional().allow('').max(50),
  gstPercentage: Joi.number().min(0).max(100).optional().default(0),
  defaultModelNumber: Joi.string().optional().allow('').max(100),
  price: Joi.number().min(0).optional().default(0),
  mrp: Joi.number().min(0).optional().default(0),
  costPrice: Joi.number().min(0).optional().default(0),
  quantity: Joi.number().integer().min(0).optional().default(0),
  hasVariants: Joi.boolean().optional().default(false),
  variants: Joi.array().items(variantJoi).optional().default([]),
  variantCombinations: Joi.array().items(variantCombinationJoi).optional().default([]),
  images: Joi.array().items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/)).optional().default([]),
  weight: Joi.number().min(0).optional().default(0),
  weightUnit: Joi.string().valid('g', 'kg', 'lb', 'oz').optional().default('g'),
  dimensions: dimensionsJoi.optional(),
  dimensionUnit: Joi.string().valid('cm', 'in', 'm').optional().default('cm'),
  tags: Joi.array().items(Joi.string()).optional().default([]),
  status: Joi.string().valid('active', 'inactive', 'draft').optional().default('draft'),
  unit: Joi.string().optional().default('pcs'),
})

export const listProductSchema = Joi.object({
  pageNumber: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().allow('', null),
  category: Joi.string().allow('', null),
  subcategory: Joi.string().allow('', null),
  brand: Joi.string().allow('', null),
  status: Joi.string().valid('active', 'inactive', 'draft').allow('', null),
  sortBy: Joi.string().valid('name', 'createdAt').optional().default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').optional().default('desc'),
})

export const getProductByIdSchema = Joi.object({
  productId: Joi.string().required(),
})

export const updateProductSchema = Joi.object({
  productId: Joi.string().required(),
  name: Joi.string().min(2).max(200).optional(),
  shortDescription: Joi.string().optional().allow(''),
  sku: Joi.string().min(1).max(50).optional(),
  category: Joi.string().optional(),
  subcategory: Joi.string().optional().allow(null, ''),
  brand: Joi.string().optional().allow(null, ''),
  group: Joi.string().optional().allow(null, ''),
  hsnNumber: Joi.string().optional().allow('').max(50),
  gstPercentage: Joi.number().min(0).max(100).optional(),
  defaultModelNumber: Joi.string().optional().allow('').max(100),
  price: Joi.number().min(0).optional(),
  mrp: Joi.number().min(0).optional(),
  costPrice: Joi.number().min(0).optional(),
  quantity: Joi.number().integer().min(0).optional(),
  hasVariants: Joi.boolean().optional(),
  variants: Joi.array().items(variantJoi).optional(),
  variantCombinations: Joi.array().items(variantCombinationJoi).optional(),
  images: Joi.array().items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/)).optional(),
  weight: Joi.number().min(0).optional(),
  weightUnit: Joi.string().valid('g', 'kg', 'lb', 'oz').optional(),
  dimensions: dimensionsJoi.optional(),
  dimensionUnit: Joi.string().valid('cm', 'in', 'm').optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  status: Joi.string().valid('active', 'inactive', 'draft').optional(),
  unit: Joi.string().optional(),
})

export const deleteProductSchema = Joi.object({
  productId: Joi.string().required(),
})
