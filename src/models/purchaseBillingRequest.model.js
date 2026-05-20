import mongoose from 'mongoose'
import { v4 as uuidv4 } from 'uuid'
import { commonFieldsPlugin } from './plugin/commonFields.plugin.js'
import { SchemaTypes } from '../core/common/schemaTypes.js'

export const PURCHASE_BILLING_REQUEST_STATUS = Object.freeze({
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
})

const purchaseBillingRequestSchema = new mongoose.Schema(
  {
    uniqueId: {
      type: String,
      unique: true,
      default: uuidv4,
    },
    /** PO line this payment request was raised for */
    poProductId: {
      type: SchemaTypes.ObjectId,
      ref: 'poProduct',
      required: true,
    },
    purchaseOrderId: {
      type: SchemaTypes.ObjectId,
      ref: 'purchaseOrder',
      default: null,
      index: true,
    },
    amount: {
      type: SchemaTypes.Number,
      required: true,
      min: 0,
    },
    /** Bill / attachment document */
    billDocumentId: {
      type: SchemaTypes.ObjectId,
      ref: 'document',
      required: true,
    },
    /** Optional payment / approval proof (uploaded from billing request review) */
    proofDocumentId: {
      type: SchemaTypes.ObjectId,
      ref: 'document',
      default: null,
    },
    status: {
      type: SchemaTypes.String,
      enum: Object.values(PURCHASE_BILLING_REQUEST_STATUS),
      default: PURCHASE_BILLING_REQUEST_STATUS.PENDING,
      index: true,
      trim: true,
    },
    createdBy: {
      type: SchemaTypes.ObjectId,
      ref: 'employee',
      required: true,
      index: true,
    },
    /**
     * Full employee record at submit time (password and other sensitive fields stripped).
     */
    createdBySnapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    /**
     * PO line / product context at submit time.
     */
    productSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    branchId: {
      type: SchemaTypes.ObjectId,
      ref: 'companyBranch',
      default: null,
      index: true,
    },
    approvedBy: {
      type: SchemaTypes.ObjectId,
      ref: 'employee',
      default: null,
    },
    /** Full approver at decision time (optional until approved / rejected) */
    approvedBySnapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    approvedAt: { type: SchemaTypes.Date, default: null },
    statusRemark: { type: SchemaTypes.String, trim: true, default: '' },
    /** Optional note from submitter when raising the payment request */
    requestRemark: { type: SchemaTypes.String, trim: true, default: '' },
    /** Supplier info at submit time — either from DB or manually entered. */
    supplierSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { timestamps: true, collection: 'purchase_billing_requests' }
)

purchaseBillingRequestSchema.index({ poProductId: 1 }, { unique: true })

purchaseBillingRequestSchema.plugin(commonFieldsPlugin)

const PurchaseBillingRequestModel = mongoose.model(
  'purchaseBillingRequest',
  purchaseBillingRequestSchema
)

export default PurchaseBillingRequestModel
