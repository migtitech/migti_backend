import mongoose from 'mongoose'
import { commonFieldsPlugin } from './plugin/commonFields.plugin.js'
import { SchemaTypes } from '../core/common/schemaTypes.js'

const productVariantSchema = new mongoose.Schema(
  {
    variantName: { type: SchemaTypes.String, trim: true, default: '' },
  },
  { _id: true }
)

const PRO_BUCKET_STATUS = Object.freeze({
  APPROVAL_PENDING: 'approval_pending',
  PENDING: 'pending',
  RATE_SUBMITTED: 'rate_submitted',
  FULFILLED: 'fulfilled',
})

/** Submitted rate line for Pro Bucket (supplier snapshot at save time) */
const proBucketRateEntrySchema = new mongoose.Schema(
  {
    supplier: { type: mongoose.Schema.Types.Mixed, default: null },
    rate: { type: SchemaTypes.Number, required: true, min: 0 },
    unit: { type: SchemaTypes.String, trim: true, default: '' },
    remark: { type: SchemaTypes.String, default: '' },
    submittedAt: { type: Date, default: Date.now },
    submittedBy: { type: SchemaTypes.ObjectId, ref: 'employee', default: null },
  },
  { _id: true }
)

export const deriveProBucketStatus = (ratesLength) => {
  const n = Number(ratesLength) || 0
  if (n >= 3) return PRO_BUCKET_STATUS.FULFILLED
  if (n >= 1) return PRO_BUCKET_STATUS.RATE_SUBMITTED
  return PRO_BUCKET_STATUS.PENDING
}

export { PRO_BUCKET_STATUS }

/**
 * One document per line item – mirrors `query.products[]` and stores `queryId` + `queryCode`.
 * Collection: `query_products`
 */
const queryProductSchema = new mongoose.Schema(
  {
    queryId: {
      type: SchemaTypes.ObjectId,
      ref: 'query',
      required: true,
      index: true,
    },
    queryCode: {
      type: SchemaTypes.String,
      trim: true,
      default: '',
      index: true,
    },
    /** Order in the source query’s `products` array (0-based) */
    lineIndex: { type: SchemaTypes.Number, required: true, min: 0 },
    productName: { type: SchemaTypes.String, required: true, trim: true },
    quantity: { type: SchemaTypes.Number, required: true, min: 0, default: 1 },
    unit: { type: SchemaTypes.String, trim: true, default: '' },
    hsnNumber: { type: SchemaTypes.String, trim: true, default: '' },
    modelNumber: { type: SchemaTypes.String, trim: true, default: '' },
    gstPercentage: {
      type: SchemaTypes.Number,
      min: 0,
      max: 100,
      default: null,
    },
    variants: { type: [productVariantSchema], default: [] },
    remark: { type: SchemaTypes.String, default: '' },
    description: { type: SchemaTypes.String, default: '' },
    product_id: { type: SchemaTypes.ObjectId, ref: 'product', default: null },
    groupId: { type: SchemaTypes.ObjectId, ref: 'group', default: null },
    categoryId: { type: SchemaTypes.ObjectId, ref: 'category', default: null },
    subcategoryId: {
      type: SchemaTypes.ObjectId,
      ref: 'category',
      default: null,
    },
    rawProductCode: { type: SchemaTypes.String, trim: true, default: '' },
    query_tracking_code: { type: SchemaTypes.String, trim: true, default: '' },
    images: [{ type: SchemaTypes.ObjectId, ref: 'document' }],
    /** Pro Bucket: procurement rates on this line */
    status: {
      type: SchemaTypes.String,
      enum: Object.values(PRO_BUCKET_STATUS),
      default: PRO_BUCKET_STATUS.PENDING,
      index: true,
    },
    /** Set to true when HOD has approved this line; restricts further edits to HOD only. */
    hodApproved: { type: Boolean, default: false, index: true },
    rates: { type: [proBucketRateEntrySchema], default: [] },
  },
  { timestamps: true, collection: 'query_products' }
)

queryProductSchema.index({ queryId: 1, lineIndex: 1 })
queryProductSchema.index({ groupId: 1, isDeleted: 1, status: 1 })

queryProductSchema.plugin(commonFieldsPlugin)

const QueryProductModel = mongoose.model('queryProduct', queryProductSchema)

export default QueryProductModel
