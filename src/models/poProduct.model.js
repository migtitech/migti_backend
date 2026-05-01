import mongoose from 'mongoose'
import { commonFieldsPlugin } from './plugin/commonFields.plugin.js'
import { SchemaTypes } from '../core/common/schemaTypes.js'

const purchaseManagerSchema = new mongoose.Schema(
  {
    name: { type: SchemaTypes.String, trim: true, default: '' },
    phone: { type: SchemaTypes.String, trim: true, default: '' },
    email: {
      type: SchemaTypes.String,
      trim: true,
      lowercase: true,
      default: '',
    },
  },
  { _id: false }
)

const companyInfoSchema = new mongoose.Schema(
  {
    name: { type: SchemaTypes.String, trim: true, default: '' },
    area: { type: SchemaTypes.String, trim: true, default: '' },
    location: { type: SchemaTypes.String, trim: true, default: '' },
    address: { type: SchemaTypes.String, default: '' },
    purchaseManagers: { type: [purchaseManagerSchema], default: [] },
  },
  { _id: false }
)

const queryRateEntrySchema = new mongoose.Schema(
  {
    supplier: { type: mongoose.Schema.Types.Mixed, default: null },
    rate: { type: SchemaTypes.Number, min: 0, default: null },
    unit: { type: SchemaTypes.String, trim: true, default: '' },
    remark: { type: SchemaTypes.String, default: '' },
    submittedAt: { type: Date, default: null },
    submittedBy: { type: SchemaTypes.ObjectId, ref: 'employee', default: null },
  },
  { _id: false }
)

const poProductSchema = new mongoose.Schema(
  {
    purchaseOrderId: {
      type: SchemaTypes.ObjectId,
      ref: 'purchaseOrder',
      required: true,
      index: true,
    },
    poCode: { type: SchemaTypes.String, trim: true, default: '', index: true },
    quotationId: {
      type: SchemaTypes.ObjectId,
      ref: 'quotation',
      default: null,
    },
    queryId: {
      type: SchemaTypes.ObjectId,
      ref: 'query',
      default: null,
      index: true,
    },
    industry_id: { type: SchemaTypes.ObjectId, ref: 'industry', default: null },
    companyInfo: { type: companyInfoSchema, default: () => ({}) },
    branchId: {
      type: SchemaTypes.ObjectId,
      ref: 'companyBranch',
      default: null,
    },
    lineIndex: { type: SchemaTypes.Number, required: true, min: 0 },
    productName: { type: SchemaTypes.String, required: true, trim: true },
    description: { type: SchemaTypes.String, default: '' },
    quantity: { type: SchemaTypes.Number, required: true, min: 0, default: 1 },
    unit: { type: SchemaTypes.String, trim: true, default: '' },
    hsnNumber: { type: SchemaTypes.String, trim: true, default: '' },
    modelNumber: { type: SchemaTypes.String, trim: true, default: '' },
    rawProductCode: {
      type: SchemaTypes.String,
      trim: true,
      default: '',
      index: true,
    },
    dispatchmentDate: { type: SchemaTypes.Date, default: null },
    gstPercentage: {
      type: SchemaTypes.Number,
      min: 0,
      max: 100,
      default: null,
    },
    remark: { type: SchemaTypes.String, default: '' },
    product_id: { type: SchemaTypes.ObjectId, ref: 'product', default: null },
    attachmentDocumentId: {
      type: SchemaTypes.ObjectId,
      ref: 'document',
      default: null,
    },
    /** Client receiving / delivery proof (dispatchment) */
    receivingDocumentId: {
      type: SchemaTypes.ObjectId,
      ref: 'document',
      default: null,
    },
    /** Remark when marking received / delivered (dispatchment) */
    receivingRemark: { type: SchemaTypes.String, default: '' },
    poRate: { type: SchemaTypes.Number, min: 0, default: null },
    applyDiscount: { type: SchemaTypes.Boolean, default: false },
    discountPercentage: {
      type: SchemaTypes.Number,
      min: 0,
      max: 100,
      default: null,
    },
    discountAmount: { type: SchemaTypes.Number, min: 0, default: null },
    notAvailable: { type: SchemaTypes.Boolean, default: false },
    notAvailableRemark: { type: SchemaTypes.String, default: '' },
    priority: {
      type: SchemaTypes.String,
      enum: ['high', 'medium', 'low'],
      default: 'medium',
      trim: true,
    },
    queryRate: { type: [queryRateEntrySchema], default: [] },
    /** Purchase Bucket: procurement payment request workflow */
    procurementStatus: {
      type: SchemaTypes.String,
      enum: ['open', 'payment_request_raised', 'finance_approved'],
      default: 'open',
      index: true,
      trim: true,
    },
    paymentRequestAmount: {
      type: SchemaTypes.Number,
      min: 0,
      default: null,
    },
    paymentRequestBillDocumentId: {
      type: SchemaTypes.ObjectId,
      ref: 'document',
      default: null,
    },
    paymentRequestRaisedAt: { type: SchemaTypes.Date, default: null },
    paymentRequestRaisedBy: {
      type: SchemaTypes.ObjectId,
      ref: 'employee',
      default: null,
    },
    /** Link to `purchase_billing_requests` when a purchase payment request is raised */
    purchaseBillingRequestId: {
      type: SchemaTypes.ObjectId,
      ref: 'purchaseBillingRequest',
      default: null,
      index: true,
    },
    /**
     * Line workflow: inventory / dispatch, plus purchase-bucket payment request.
     * Legacy key in DB was `inventoryStatus` — read with $ifNull / fallback in services.
     */
    status: {
      type: SchemaTypes.String,
      enum: [
        'pending',
        'purchased',
        'inventory_received',
        'ready_for_dispatchment',
        'delivered',
        'payment_request_raised',
        'finance_approved',
      ],
      default: 'pending',
      index: true,
      trim: true,
    },
  },
  { timestamps: true, collection: 'po_products' }
)

export const PO_PRODUCT_PROCUREMENT_STATUS = Object.freeze({
  OPEN: 'open',
  PAYMENT_REQUEST_RAISED: 'payment_request_raised',
})

/** @deprecated use PO_PRODUCT_LINE_STATUS — alias for existing imports */
export const PO_PRODUCT_INVENTORY_STATUS = Object.freeze({
  PENDING: 'pending',
  INVENTORY_RECEIVED: 'inventory_received',
  READY_FOR_DISPATCHMENT: 'ready_for_dispatchment',
  DELIVERED: 'delivered',
})

export const PO_PRODUCT_LINE_STATUS = PO_PRODUCT_INVENTORY_STATUS

/**
 * Effective line workflow (canonical `status` on `po_products`; legacy `inventoryStatus` in old docs).
 */
export const resolvePoProductLineStatus = (doc) => {
  if (!doc || typeof doc !== 'object') return 'pending'
  const s0 = String((doc.status ?? doc.inventoryStatus) || '').trim()
  if (s0 === 'purchased') return 'purchased'
  if (
    s0 === 'finance_approved' ||
    String(doc.procurementStatus || '').trim() === 'finance_approved'
  ) {
    return 'finance_approved'
  }
  const s = doc.status ?? doc.inventoryStatus
  if (s == null || s === '') {
    if (doc.procurementStatus === 'payment_request_raised') {
      return 'payment_request_raised'
    }
    return 'pending'
  }
  const t = String(s)
  if (t === 'purchased') return 'purchased'
  if (t === 'finance_approved') return 'finance_approved'
  if (
    t === 'ready_for_dispatchment' ||
    t === 'inventory_received' ||
    t === 'delivered' ||
    t === 'pending' ||
    t === 'payment_request_raised'
  )
    return t
  return 'pending'
}

poProductSchema.index({ purchaseOrderId: 1, lineIndex: 1 }, { unique: true })
poProductSchema.index({ queryId: 1, rawProductCode: 1 })

poProductSchema.plugin(commonFieldsPlugin)

const PoProductModel = mongoose.model('poProduct', poProductSchema)

export default PoProductModel
