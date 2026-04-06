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

// Company/industry snapshot stored in query (editable, does not change industry table)
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

// Variant (multiple per product)
const productVariantSchema = new mongoose.Schema(
  {
    variantName: { type: SchemaTypes.String, trim: true, default: '' },
  },
  { _id: true },
)

const convertedQuotationRefSchema = new mongoose.Schema(
  {
    quotationId: { type: SchemaTypes.ObjectId, ref: 'quotation', required: true },
    quotationCode: { type: SchemaTypes.String, trim: true, default: '' },
  },
  { _id: false },
)

const productItemSchema = new mongoose.Schema(
  {
    productName: { type: SchemaTypes.String, required: true, trim: true },
    quantity: { type: SchemaTypes.Number, required: true, min: 0, default: 1 },
    unit: { type: SchemaTypes.String, trim: true, default: '' },
    hsnNumber: { type: SchemaTypes.String, trim: true, default: '' },
    modelNumber: { type: SchemaTypes.String, trim: true, default: '' },
    gstPercentage: { type: SchemaTypes.Number, min: 0, max: 100, default: null },
    variants: { type: [productVariantSchema], default: [] },
    remark: { type: SchemaTypes.String, default: '' },
    description: { type: SchemaTypes.String, default: '' },
    product_id: { type: SchemaTypes.ObjectId, ref: 'product', default: null },
    images: [{ type: SchemaTypes.ObjectId, ref: 'document' }],
  },
  { _id: true },
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
      enum: ['drafted', 'convertedToQuotation', 'closed'],
      default: 'drafted',
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
    convertedQuotations: {
      type: [convertedQuotationRefSchema],
      default: [],
    },
    close_remark: {
      type: SchemaTypes.String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true },
)

querySchema.plugin(commonFieldsPlugin)

const QueryModel = mongoose.model('query', querySchema)

export default QueryModel
