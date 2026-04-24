import mongoose from 'mongoose'
import { commonFieldsPlugin } from './plugin/commonFields.plugin.js'
import { SchemaTypes } from '../core/common/schemaTypes.js'

const rateLogSchema = new mongoose.Schema(
  {
    quotationId: {
      type: SchemaTypes.ObjectId,
      ref: 'quotation',
      default: null,
      index: true,
    },
    product_title: {
      type: SchemaTypes.String,
      trim: true,
      default: '',
      index: true,
    },
    description: {
      type: SchemaTypes.String,
      default: '',
    },
    variants: {
      type: [SchemaTypes.String],
      default: [],
    },
    amount: {
      type: SchemaTypes.Number,
      min: 0,
      required: true,
      index: true,
    },
    unit: {
      type: SchemaTypes.String,
      trim: true,
      default: '',
    },
    industry_name: {
      type: SchemaTypes.String,
      trim: true,
      default: '',
      index: true,
    },
    created_by: {
      type: SchemaTypes.ObjectId,
      ref: 'employee',
      default: null,
      index: true,
    },
    branchId: {
      type: SchemaTypes.ObjectId,
      ref: 'companyBranch',
      default: null,
      index: true,
    },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } }
)

rateLogSchema.plugin(commonFieldsPlugin)

const RateLogModel = mongoose.model('rate_logs', rateLogSchema)

export default RateLogModel
