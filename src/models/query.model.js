import mongoose from 'mongoose'
import { v4 as uuidv4 } from 'uuid'
import { commonFieldsPlugin } from './plugin/commonFields.plugin.js'
import { SchemaTypes } from '../core/common/schemaTypes.js'

// Company/industry snapshot stored in query (editable, does not change industry table)
const companyInfoSchema = new mongoose.Schema(
  {
    name: { type: SchemaTypes.String, trim: true, default: '' },
    area: { type: SchemaTypes.String, trim: true, default: '' },
    location: { type: SchemaTypes.String, trim: true, default: '' },
    address: { type: SchemaTypes.String, default: '' },
    purchase_manager_name: { type: SchemaTypes.String, trim: true, default: '' },
    purchase_manager_phone: { type: SchemaTypes.String, trim: true, default: '' },
    email: { type: SchemaTypes.String, trim: true, lowercase: true, default: '' },
  },
  { _id: false },
)

// Variant with quantity (multiple per product)
const productVariantSchema = new mongoose.Schema(
  {
    variantName: { type: SchemaTypes.String, trim: true, default: '' },
    quantity: { type: SchemaTypes.Number, min: 0, default: 1 },
  },
  { _id: true },
)

const productItemSchema = new mongoose.Schema(
  {
    productName: { type: SchemaTypes.String, required: true, trim: true },
    quantity: { type: SchemaTypes.Number, required: true, min: 0, default: 1 },
    unit: { type: SchemaTypes.String, trim: true, default: '' },
    variants: { type: [productVariantSchema], default: [] },
    remark: { type: SchemaTypes.String, default: '' },
    product_id: { type: SchemaTypes.ObjectId, ref: 'product', default: null },
  },
  { _id: true },
)

const deliveryInfoSchema = new mongoose.Schema(
  {
    location: { type: SchemaTypes.String, trim: true, default: '' },
    contactPersonName: { type: SchemaTypes.String, trim: true, default: '' },
    contactPersonPhone: { type: SchemaTypes.String, trim: true, default: '' },
    expectedDateByCompany: { type: SchemaTypes.Date, default: null },
    urgent: { type: SchemaTypes.Boolean, default: false },
  },
  { _id: false },
)

const querySchema = new mongoose.Schema(
  {
    uniqueId: {
      type: String,
      unique: true,
      default: uuidv4,
    },
    queryCode: {
      type: SchemaTypes.String,
      trim: true,
      uppercase: true,
      unique: true,
      sparse: true,
    },
    status: {
      type: SchemaTypes.String,
      enum: [
        'pending',
        'followup01pending',
        'followup02pending',
        'followup03pending',
        'progress',
        'convertedToQuotation',
        'closed',
      ],
      default: 'pending',
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
      type: [productItemSchema],
      default: [],
    },
    delivery: {
      type: deliveryInfoSchema,
      default: () => ({}),
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

querySchema.plugin(commonFieldsPlugin)

const QueryModel = mongoose.model('query', querySchema)

export default QueryModel
