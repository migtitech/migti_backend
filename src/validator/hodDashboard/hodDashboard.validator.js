import Joi from 'joi'

const dateString = Joi.string()
  .pattern(/^\d{4}-\d{2}-\d{2}$/)
  .messages({ 'string.pattern.base': 'Date must be in YYYY-MM-DD format' })

const periodValues = ['all', 'daily', 'weekly', 'monthly', 'yearly']

/** Pending-action queue types the HOD dashboard exposes. */
export const HOD_PENDING_TYPES = Object.freeze([
  'quotations',
  'purchase_orders',
  'pro_bucket',
  'billing_requests',
  'deliveries',
])

export const hodOverviewSchema = Joi.object({
  branchId: Joi.string().allow('').optional(),
  status: Joi.string().allow('').optional(),
  dateFrom: dateString.allow('').optional(),
  dateTo: dateString.allow('').optional(),
  period: Joi.string()
    .valid(...periodValues)
    .default('monthly'),
})

export const hodPendingItemsSchema = Joi.object({
  type: Joi.string()
    .valid(...HOD_PENDING_TYPES)
    .required(),
  branchId: Joi.string().allow('').optional(),
  status: Joi.string().allow('').optional(),
  search: Joi.string().allow('').optional(),
  dateFrom: dateString.allow('').optional(),
  dateTo: dateString.allow('').optional(),
  pageNumber: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(10),
})
