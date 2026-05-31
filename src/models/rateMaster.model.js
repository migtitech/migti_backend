import mongoose from 'mongoose'
import { commonFieldsPlugin } from './plugin/commonFields.plugin.js'
import { SchemaTypes } from '../core/common/schemaTypes.js'

/**
 * Source action that produced a Rate_master row.
 * - procurement: rate uploaded in the pro bucket
 * - quoted: rate captured when a quotation is generated/updated
 * - po: rate captured when a purchase order is created/updated
 * - billing: amount captured when a billing request is raised
 */
export const RATE_MASTER_TYPE = Object.freeze({
  PROCUREMENT: 'procurement',
  QUOTED: 'quoted',
  PO: 'po',
  BILLING: 'billing',
})

const rateMasterTypeValues = Object.values(RATE_MASTER_TYPE)

const rateMasterSchema = new mongoose.Schema(
  {
    productCode: {
      type: SchemaTypes.String,
      trim: true,
      uppercase: true,
      required: true,
      index: true,
    },
    rate: {
      type: SchemaTypes.Number,
      min: 0,
      default: null,
    },
    unit: {
      type: SchemaTypes.String,
      trim: true,
      default: '',
    },
    /** Supplier snapshot at capture time (may be null for quotation/po). */
    supplierSnapshot: {
      type: SchemaTypes.Mixed,
      default: null,
    },
    type: {
      type: SchemaTypes.String,
      enum: rateMasterTypeValues,
      required: true,
      index: true,
    },
    /**
     * Dedup driver: the stage code that produced the row
     * (queryCode | quotationCode | poCode | billingRequestCode).
     */
    sourceCode: {
      type: SchemaTypes.String,
      trim: true,
      default: '',
      index: true,
    },
    /** Originating document id for traceability (queryProduct/quotation/po/billingRequest). */
    sourceId: {
      type: SchemaTypes.ObjectId,
      default: null,
    },
    procurementSnapshot: { type: SchemaTypes.Mixed, default: null },
    quotationSnapshot: { type: SchemaTypes.Mixed, default: null },
    poSnapshot: { type: SchemaTypes.Mixed, default: null },
    purchaseSnapshot: { type: SchemaTypes.Mixed, default: null },
    branchId: {
      type: SchemaTypes.ObjectId,
      ref: 'companyBranch',
      default: null,
      index: true,
    },
  },
  { timestamps: true, collection: 'rate_masters' }
)

rateMasterSchema.plugin(commonFieldsPlugin)

/**
 * One row per stage + code + product. Re-running a stage with the same
 * code/product updates the existing row instead of creating a new one.
 */
rateMasterSchema.index(
  { type: 1, sourceCode: 1, productCode: 1 },
  { unique: true }
)

const RateMasterModel = mongoose.model('rateMaster', rateMasterSchema)

export default RateMasterModel
