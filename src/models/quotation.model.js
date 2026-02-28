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

// Quotation line item: same as query product + rate (submitted per line)
const quotationProductItemSchema = new mongoose.Schema(
  {
    productName: { type: SchemaTypes.String, required: true, trim: true },
    quantity: { type: SchemaTypes.Number, required: true, min: 0, default: 1 },
    unit: { type: SchemaTypes.String, trim: true, default: '' },
    hsnNumber: { type: SchemaTypes.String, trim: true, default: '' },
    modelNumber: { type: SchemaTypes.String, trim: true, default: '' },
    gstPercentage: { type: SchemaTypes.Number, min: 0, max: 100, default: null },
    variants: { type: [productVariantSchema], default: [] },
    remark: { type: SchemaTypes.String, default: '' },
    product_id: { type: SchemaTypes.ObjectId, ref: 'product', default: null },
    rate: { type: SchemaTypes.Number, min: 0, default: null },
  },
  { _id: true },
)

export const QUOTATION_STATUS = {
  DRAFT: 'draft',
  PARTIAL: 'partial',
  FULFILLED: 'fulfilled',
  READY: 'ready',
  SENT_TO_CLIENT: 'sentToClient',
  PO_RECEIVED: 'poReceived',
  FOLLOWUP01: 'followup01',
  FOLLOWUP02: 'followup02',
  CLOSED: 'closed',
}

const quotationStatusValues = Object.values(QUOTATION_STATUS)

const quotationSchema = new mongoose.Schema(
  {
    uniqueId: {
      type: String,
      unique: true,
      default: uuidv4,
    },
    quotationCode: {
      type: SchemaTypes.String,
      trim: true,
      uppercase: true,
      unique: true,
      sparse: true,
    },
    queryId: {
      type: SchemaTypes.ObjectId,
      ref: 'query',
      required: true,
      index: true,
    },
    status: {
      type: SchemaTypes.String,
      enum: quotationStatusValues,
      default: QUOTATION_STATUS.DRAFT,
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
      type: [quotationProductItemSchema],
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
  },
  { timestamps: true },
)

quotationSchema.plugin(commonFieldsPlugin)

const QuotationModel = mongoose.model('quotation', quotationSchema)

export default QuotationModel
