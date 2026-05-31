import Joi from 'joi'

const purchaseManagerSchema = Joi.object({
  name: Joi.string().allow('').optional(),
  phone: Joi.string().allow('').optional(),
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .allow('')
    .optional(),
  department: Joi.string().allow('').optional(),
})

const companyInfoSchema = Joi.object({
  name: Joi.string().allow('').optional(),
  area: Joi.string().allow('').optional(),
  subZoneId: Joi.string()
    .pattern(/^[a-fA-F0-9]{24}$/)
    .allow('', null)
    .optional(),
  location: Joi.string().allow('').optional(),
  address: Joi.string().allow('').optional(),
  purchaseManagers: Joi.array()
    .items(purchaseManagerSchema)
    .optional()
    .default([]),
})

const productVariantSchema = Joi.object({
  variantName: Joi.string().allow('').optional(),
})

const objectIdSchema = Joi.string().pattern(/^[a-fA-F0-9]{24}$/)
const imageItemSchema = Joi.alternatives().try(
  objectIdSchema,
  Joi.object({ _id: objectIdSchema.required() }).unknown(true)
)

const productItemSchema = Joi.object({
  productName: Joi.string().required().trim(),
  quantity: Joi.number().integer().min(0).required(),
  unit: Joi.string().allow('').optional(),
  hsnNumber: Joi.string().allow('').optional(),
  modelNumber: Joi.string().allow('').optional(),
  gstPercentage: Joi.number().min(0).max(100).allow(null).optional(),
  variants: Joi.array().items(productVariantSchema).optional().default([]),
  remark: Joi.string().allow('').optional(),
  description: Joi.string().allow('').optional(),
  product_id: Joi.string().allow(null, '').optional(),
  groupId: objectIdSchema.allow(null, '').optional(),
  categoryId: objectIdSchema.allow(null, '').optional(),
  rawProductCode: Joi.string().allow('', null).max(100).optional(),
  /** NQP row’s `query_tracking_code` (denormalized) when the line is from “mark as new” */
  query_tracking_code: Joi.string().allow('', null).max(100).optional(),
  images: Joi.array().items(imageItemSchema).optional().default([]),
})

const queryStatusValues = ['drafted', 'convertedToQuotation', 'closed']

export const createQuerySchema = Joi.object({
  companyInfo: companyInfoSchema.optional().default({}),
  industry_id: Joi.string().allow(null, '').optional(),
  products: Joi.array().items(productItemSchema).optional().default([]),
  status: Joi.string()
    .valid(...queryStatusValues)
    .optional()
    .default('drafted'),
  created_by: Joi.string().allow(null, '').optional(),
})

const dateOnlySchema = Joi.string()
  .pattern(/^\d{4}-\d{2}-\d{2}$/)
  .messages({ 'string.pattern.base': 'Date must be YYYY-MM-DD' })

export const listQuerySchema = Joi.object({
  pageNumber: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().allow('').optional(),
  status: Joi.string()
    .valid(...queryStatusValues)
    .allow('')
    .optional(),
  dateFrom: Joi.alternatives()
    .try(Joi.string().valid(''), dateOnlySchema)
    .optional(),
  dateTo: Joi.alternatives()
    .try(Joi.string().valid(''), dateOnlySchema)
    .optional(),
  areaIds: Joi.string().allow('').optional(),
  zoneIds: Joi.string().allow('').optional(),
  industryId: Joi.string()
    .pattern(/^[a-fA-F0-9]{24}$/)
    .optional()
    .messages({
      'string.pattern.base': 'industryId must be a valid Mongo ObjectId',
    }),
})

export const listQueriesByIndustrySchema = Joi.object({
  industryId: Joi.string()
    .pattern(/^[a-fA-F0-9]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'industryId must be a valid Mongo ObjectId',
    }),
  pageNumber: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(10),
})

export const branchAnalyticsSchema = Joi.object({
  branchId: Joi.string()
    .pattern(/^[a-fA-F0-9]{24}$/)
    .allow('')
    .optional(),
  period: Joi.string()
    .valid('all', 'daily', 'weekly', 'monthly', 'yearly')
    .default('all'),
  dateFrom: Joi.alternatives()
    .try(Joi.string().valid(''), dateOnlySchema)
    .optional(),
  dateTo: Joi.alternatives()
    .try(Joi.string().valid(''), dateOnlySchema)
    .optional(),
  tab: Joi.string()
    .valid('queries', 'quotations', 'po', 'billing')
    .default('queries'),
  pageNumber: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(10),
})

export const targetAnalyticsSchema = Joi.object({
  branchId: Joi.string()
    .pattern(/^[a-fA-F0-9]{24}$/)
    .required(),
  period: Joi.string().valid('weekly', 'monthly').required(),
  dateFrom: dateOnlySchema.required(),
  dateTo: dateOnlySchema.required(),
  targetAmount: Joi.number().min(0).required(),
})

export const listTargetAnalyticsSchema = Joi.object({
  branchId: Joi.string()
    .pattern(/^[a-fA-F0-9]{24}$/)
    .allow('')
    .optional(),
  period: Joi.string().valid('', 'weekly', 'monthly').optional(),
  dateFrom: Joi.alternatives()
    .try(Joi.string().valid(''), dateOnlySchema)
    .optional(),
  dateTo: Joi.alternatives()
    .try(Joi.string().valid(''), dateOnlySchema)
    .optional(),
})

export const targetSummarySchema = Joi.object({
  branchId: Joi.string()
    .pattern(/^[a-fA-F0-9]{24}$/)
    .required(),
  period: Joi.string().valid('weekly', 'monthly').required(),
})

export const zoneTargetAnalyticsSchema = Joi.object({
  branchId: Joi.string()
    .pattern(/^[a-fA-F0-9]{24}$/)
    .required(),
  zoneId: Joi.string()
    .pattern(/^[a-fA-F0-9]{24}$/)
    .required(),
  period: Joi.string().valid('weekly', 'monthly').required(),
  dateFrom: dateOnlySchema.required(),
  dateTo: dateOnlySchema.required(),
  targetAmount: Joi.number().min(0).required(),
  remark: Joi.string().allow('', null).optional(),
  status: Joi.string().valid('active', 'closed').optional(),
})

export const zoneTargetSummarySchema = Joi.object({
  branchId: Joi.string()
    .pattern(/^[a-fA-F0-9]{24}$/)
    .required(),
  zoneId: Joi.string()
    .pattern(/^[a-fA-F0-9]{24}$/)
    .required(),
  period: Joi.string().valid('weekly', 'monthly').required(),
})

export const listZoneTargetAnalyticsSchema = Joi.object({
  branchId: Joi.string()
    .pattern(/^[a-fA-F0-9]{24}$/)
    .allow('')
    .optional(),
  zoneId: Joi.string()
    .pattern(/^[a-fA-F0-9]{24}$/)
    .allow('')
    .optional(),
  period: Joi.string().valid('', 'weekly', 'monthly').optional(),
})

export const employeeTargetAnalyticsSchema = Joi.object({
  branchId: Joi.string()
    .pattern(/^[a-fA-F0-9]{24}$/)
    .required(),
  zoneId: Joi.string()
    .pattern(/^[a-fA-F0-9]{24}$/)
    .allow('', null)
    .optional(),
  employeeId: Joi.string()
    .pattern(/^[a-fA-F0-9]{24}$/)
    .required(),
  period: Joi.string().valid('weekly', 'monthly').required(),
  dateFrom: dateOnlySchema.required(),
  dateTo: dateOnlySchema.required(),
  targetAmount: Joi.number().min(0).required(),
})

export const employeeTargetSummarySchema = Joi.object({
  branchId: Joi.string()
    .pattern(/^[a-fA-F0-9]{24}$/)
    .required(),
  employeeId: Joi.string()
    .pattern(/^[a-fA-F0-9]{24}$/)
    .required(),
  period: Joi.string().valid('weekly', 'monthly').required(),
})

export const listEmployeeTargetAnalyticsSchema = Joi.object({
  branchId: Joi.string()
    .pattern(/^[a-fA-F0-9]{24}$/)
    .allow('')
    .optional(),
  employeeId: Joi.string()
    .pattern(/^[a-fA-F0-9]{24}$/)
    .allow('')
    .optional(),
  period: Joi.string().valid('', 'weekly', 'monthly').optional(),
})

export const getQueryByIdSchema = Joi.object({
  queryId: Joi.string().required(),
})

export const getQueryLineProcurementRatesSchema = Joi.object({
  queryId: Joi.string().required(),
  rawProductCode: Joi.string().trim().min(1).max(100).required(),
  lineIndex: Joi.number().integer().min(0).optional(),
})

export const updateQuerySchema = Joi.object({
  queryId: Joi.string().required(),
  companyInfo: companyInfoSchema.optional(),
  industry_id: Joi.string().allow(null, '').optional(),
  products: Joi.array().items(productItemSchema).optional(),
  status: Joi.string()
    .valid(...queryStatusValues)
    .optional(),
  close_remark: Joi.string().allow('').optional(),
})

export const listQueryActivitiesSchema = Joi.object({
  queryId: Joi.string().required(),
  pageNumber: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(10),
})

export const recordQueryActivitySchema = Joi.object({
  queryId: Joi.string().required(),
  type: Joi.string().valid('viewed', 'action', 'follow_up').required(),
  performedBy: Joi.string().required(),
  meta: Joi.object({
    action: Joi.string().allow('').optional(),
    followUpStatus: Joi.string().allow('').optional(),
    note: Joi.string().allow('').optional(),
  }).optional(),
})

export const deleteQuerySchema = Joi.object({
  queryId: Joi.string().required(),
})

export const linkConvertedQuotationSchema = Joi.object({
  queryId: objectIdSchema.required(),
  quotationId: objectIdSchema.required(),
  quotationCode: Joi.string().allow('').optional().default(''),
})

export const convertQueryToQuotationSchema = Joi.object({
  queryCode: Joi.string().required(),
  forceNewQuotation: Joi.boolean().optional().default(false),
  remark: Joi.string().allow('', null).optional(),
  products: Joi.array()
    .items(
      Joi.object({
        productName: Joi.string().required(),
        quantity: Joi.number().min(0).required(),
        unit: Joi.string().allow('', null).optional(),
        hsnNumber: Joi.string().allow('', null).optional(),
        modelNumber: Joi.string().allow('', null).optional(),
        gstPercentage: Joi.number().allow(null).optional(),
        variants: Joi.array()
          .items(Joi.object({ variantName: Joi.string() }))
          .optional(),
        remark: Joi.string().allow('', null).optional(),
        description: Joi.string().allow('', null).optional(),
        rawProductCode: Joi.string().allow('', null).max(100).optional(),
        product_id: Joi.alternatives()
          .try(
            Joi.string().allow(null, ''),
            Joi.object({ _id: Joi.string() }).unknown(true)
          )
          .optional()
          .custom((val) => {
            if (val == null || val === '') return null
            if (typeof val === 'object' && val._id) return String(val._id)
            return String(val)
          }),
        images: Joi.array()
          .items(Joi.alternatives().try(Joi.string(), Joi.object()))
          .optional(),
      }).unknown(true)
    )
    .optional(),
})
