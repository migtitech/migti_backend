import mongoose from 'mongoose'
import { v4 as uuidv4 } from 'uuid'
import { commonFieldsPlugin } from './plugin/commonFields.plugin.js'
import { SchemaTypes } from '../core/common/schemaTypes.js'

const purchaseManagerSchema = new mongoose.Schema(
  {
    name: { type: SchemaTypes.String, trim: true, default: '' },
    phone: { type: SchemaTypes.String, trim: true, default: '' },
    email: { type: SchemaTypes.String, trim: true, lowercase: true, default: '' },
  },
  { _id: false },
)

const companyInfoSchema = new mongoose.Schema(
  {
    name: { type: SchemaTypes.String, trim: true, default: '' },
    area: { type: SchemaTypes.String, trim: true, default: '' },
    location: { type: SchemaTypes.String, trim: true, default: '' },
    address: { type: SchemaTypes.String, default: '' },
    purchaseManagers: { type: [purchaseManagerSchema], default: [] },
  },
  { _id: false },
)

const productVariantSchema = new mongoose.Schema(
  {
    variantName: { type: SchemaTypes.String, trim: true, default: '' },
  },
  { _id: true },
)

const paymentEntrySchema = new mongoose.Schema(
  {
    amount: { type: SchemaTypes.Number, required: true, min: 0 },
    paidAt: { type: SchemaTypes.Date, required: true, default: Date.now },
    remark: { type: SchemaTypes.String, trim: true, default: '' },
  },
  { _id: true },
)

const purchaseOrderProductItemSchema = new mongoose.Schema(
  {
    productName: { type: SchemaTypes.String, required: true, trim: true },
    description: { type: SchemaTypes.String, default: '' },
    quantity: { type: SchemaTypes.Number, required: true, min: 0, default: 1 },
    unit: { type: SchemaTypes.String, trim: true, default: '' },
    hsnNumber: { type: SchemaTypes.String, trim: true, default: '' },
    modelNumber: { type: SchemaTypes.String, trim: true, default: '' },
    gstPercentage: { type: SchemaTypes.Number, min: 0, max: 100, default: null },
    variants: { type: [productVariantSchema], default: [] },
    remark: { type: SchemaTypes.String, default: '' },
    product_id: { type: SchemaTypes.ObjectId, ref: 'product', default: null },
    rate: { type: SchemaTypes.Number, min: 0, default: null },
    images: [{ type: SchemaTypes.ObjectId, ref: 'document' }],
    applyDiscount: { type: SchemaTypes.Boolean, default: false },
    discountPercentage: { type: SchemaTypes.Number, min: 0, max: 100, default: null },
    discountAmount: { type: SchemaTypes.Number, min: 0, default: null },
    notAvailable: { type: SchemaTypes.Boolean, default: false },
    notAvailableRemark: { type: SchemaTypes.String, default: '' },
  },
  { _id: true },
)

export const PURCHASE_ORDER_STATUS = {
  DRAFT: 'draft',
  CONFIRMED: 'confirmed',
  FULFILLED: 'fulfilled',
  CANCELLED: 'cancelled',
}

const purchaseOrderStatusValues = Object.values(PURCHASE_ORDER_STATUS)

const purchaseOrderSchema = new mongoose.Schema(
  {
    uniqueId: {
      type: String,
      unique: true,
      default: uuidv4,
    },
    poCode: {
      type: SchemaTypes.String,
      trim: true,
      uppercase: true,
      unique: true,
      sparse: true,
    },
    quotationId: {
      type: SchemaTypes.ObjectId,
      ref: 'quotation',
      required: true,
      index: true,
    },
    queryId: {
      type: SchemaTypes.ObjectId,
      ref: 'query',
      required: true,
      index: true,
    },
    status: {
      type: SchemaTypes.String,
      enum: purchaseOrderStatusValues,
      default: PURCHASE_ORDER_STATUS.DRAFT,
      trim: true,
    },
    companyInfo: {
      type: companyInfoSchema,
      default: () => ({}),
    },
    industry_id: {
      type: SchemaTypes.ObjectId,
      ref: 'industry',
      default: null,
    },
    products: {
      type: [purchaseOrderProductItemSchema],
      default: [],
    },
    created_by: {
      type: SchemaTypes.ObjectId,
      ref: 'employee',
      default: null,
    },
    branchId: {
      type: SchemaTypes.ObjectId,
      ref: 'companyBranch',
      default: null,
      index: true,
    },
    remark: {
      type: SchemaTypes.String,
      trim: true,
      default: '',
    },
    freightCharge: { type: SchemaTypes.Number, min: 0, default: 0 },
    packingCharge: { type: SchemaTypes.Number, min: 0, default: 0 },
    expectedDeliveryDate: { type: SchemaTypes.Date, default: null },
    expectedDeliveryWithinDays: { type: SchemaTypes.Number, min: 0, default: null },
    salesEmployeeId: {
      type: SchemaTypes.ObjectId,
      ref: 'employee',
      default: null,
      index: true,
    },
    payments: {
      type: [paymentEntrySchema],
      default: [],
    },
  },
  { timestamps: true },
)

purchaseOrderSchema.plugin(commonFieldsPlugin)

const PurchaseOrderModel = mongoose.model('purchaseOrder', purchaseOrderSchema)

export default PurchaseOrderModel
