import mongoose from 'mongoose'
import { commonFieldsPlugin } from './plugin/commonFields.plugin.js'
import { SchemaTypes } from '../core/common/schemaTypes.js'

export const BILLING_REQUEST_STATUS = Object.freeze({
  HOD_APPROVAL_PENDING: 'hod_approval_pending',
  HOD_APPROVED: 'hod_approved',
  HOD_REJECTED: 'hod_rejected',
  FINANCE_APPROVED: 'finance_approved',
})

const billingRequestProductSchema = new mongoose.Schema(
  {
    poProductId: {
      type: SchemaTypes.ObjectId,
      ref: 'poProduct',
      required: true,
    },
    rawProductCode: { type: SchemaTypes.String, trim: true, default: '' },
    productName: { type: SchemaTypes.String, trim: true, default: '' },
    quantity: { type: SchemaTypes.Number, default: null },
    unit: { type: SchemaTypes.String, trim: true, default: '' },
    amount: { type: SchemaTypes.Number, required: true, min: 0 },
    /** Product photo saved on the po_product line */
    productImageDocId: {
      type: SchemaTypes.ObjectId,
      ref: 'document',
      default: null,
    },
    /** Supplier bill / invoice document */
    billDocId: {
      type: SchemaTypes.ObjectId,
      ref: 'document',
      default: null,
    },
    /**
     * Supplier at submit time — either populated from the suppliers table
     * or manually entered as { name, address }.
     */
    supplierSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    remark: { type: SchemaTypes.String, trim: true, default: '' },
    /** HOD per-product review */
    hodStatus: {
      type: SchemaTypes.String,
      enum: ['approved', 'rejected', null],
      default: null,
    },
    hodRemark: { type: SchemaTypes.String, trim: true, default: '' },
    hodReviewedBy: {
      type: SchemaTypes.ObjectId,
      ref: 'employee',
      default: null,
    },
    hodReviewedBySnapshot: { type: mongoose.Schema.Types.Mixed, default: null },
    hodReviewedAt: { type: SchemaTypes.Date, default: null },
    /** Set to true once the purchase team marks this product as purchased */
    isPurchased: { type: SchemaTypes.Boolean, default: false },
    purchasedAt: { type: SchemaTypes.Date, default: null },
  },
  { _id: true }
)

const billingRequestSchema = new mongoose.Schema(
  {
    /**
     * Human-readable unique code, e.g. BR-20260516-A3F2.
     * Generated at creation time.
     */
    billingRequestCode: {
      type: SchemaTypes.String,
      unique: true,
      index: true,
      trim: true,
    },
    /**
     * PO code(s) of the included products.
     * Single value when all products share a PO; comma-separated otherwise.
     */
    poCode: { type: SchemaTypes.String, trim: true, default: '', index: true },
    /** All products included in this billing request */
    products: { type: [billingRequestProductSchema], default: [] },
    status: {
      type: SchemaTypes.String,
      enum: Object.values(BILLING_REQUEST_STATUS),
      default: BILLING_REQUEST_STATUS.HOD_APPROVAL_PENDING,
      index: true,
    },
    statusRemark: { type: SchemaTypes.String, trim: true, default: '' },
    /** Employee who raised the request */
    createdBy: {
      type: SchemaTypes.ObjectId,
      ref: 'employee',
      required: true,
      index: true,
    },
    createdBySnapshot: { type: mongoose.Schema.Types.Mixed, default: null },
    /** HOD who acted on the request */
    reviewedBy: { type: SchemaTypes.ObjectId, ref: 'employee', default: null },
    reviewedBySnapshot: { type: mongoose.Schema.Types.Mixed, default: null },
    reviewedAt: { type: SchemaTypes.Date, default: null },
    branchId: {
      type: SchemaTypes.ObjectId,
      ref: 'companyBranch',
      default: null,
      index: true,
    },
    /** Finance approval fields */
    financeRemark: { type: SchemaTypes.String, trim: true, default: '' },
    paidAmount: { type: SchemaTypes.Number, default: null },
    paymentProofDocId: {
      type: SchemaTypes.ObjectId,
      ref: 'document',
      default: null,
    },
    financeApprovedBy: {
      type: SchemaTypes.ObjectId,
      ref: 'employee',
      default: null,
    },
    financeApprovedBySnapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    financeApprovedAt: { type: SchemaTypes.Date, default: null },
  },
  { timestamps: true, collection: 'billing_requests' }
)

billingRequestSchema.plugin(commonFieldsPlugin)

/** Generate a short unique code like BR-20260516-A3F2 */
billingRequestSchema.statics.generateCode = function () {
  const now = new Date()
  const yyyymmdd = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('')
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `BR-${yyyymmdd}-${rand}`
}

const BillingRequestModel = mongoose.model(
  'billingRequest',
  billingRequestSchema
)

export default BillingRequestModel
