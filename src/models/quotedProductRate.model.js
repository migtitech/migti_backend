import mongoose from 'mongoose'
import { v4 as uuidv4 } from 'uuid'
import { commonFieldsPlugin } from './plugin/commonFields.plugin.js'
import { SchemaTypes } from '../core/common/schemaTypes.js'

const quotedProductRateSchema = new mongoose.Schema(
  {
    uniqueId: {
      type: String,
      unique: true,
      default: uuidv4,
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
      default: null,
      index: true,
    },
    productId: {
      type: SchemaTypes.ObjectId,
      ref: 'product',
      default: null,
      index: true,
    },
    productCode: {
      type: SchemaTypes.String,
      trim: true,
      default: '',
      index: true,
    },
    productName: {
      type: SchemaTypes.String,
      trim: true,
      default: '',
    },
    unit: {
      type: SchemaTypes.String,
      trim: true,
      default: '',
    },
    quotedRate: {
      type: SchemaTypes.Number,
      min: 0,
      default: null,
    },
    quantity: {
      type: SchemaTypes.Number,
      min: 0,
      default: 0,
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

quotedProductRateSchema.index(
  { quotationId: 1, productId: 1, productCode: 1, productName: 1, unit: 1 },
  { name: 'quoted_rate_per_quotation_product', unique: false },
)

quotedProductRateSchema.plugin(commonFieldsPlugin)

const QuotedProductRateModel = mongoose.model('quotedProductRate', quotedProductRateSchema)

export default QuotedProductRateModel

