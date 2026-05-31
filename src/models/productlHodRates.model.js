import mongoose from 'mongoose'
import { commonFieldsPlugin } from './plugin/commonFields.plugin.js'
import { SchemaTypes } from '../core/common/schemaTypes.js'

export const PRODUCTL_HOD_RATE_STATUS = Object.freeze({
  HOD_APPROVAL_PENDING: 'hod_approval_pending',
  HOD_APPROVED: 'hod_approved',
  HOD_REJECTED: 'hod_rejected',
})

const productlHodRatesSchema = new mongoose.Schema(
  {
    pro_code: {
      type: SchemaTypes.String,
      trim: true,
      required: true,
      index: true,
    },
    min_rate: {
      type: SchemaTypes.Number,
      required: true,
      min: 0,
    },
    max_rate: {
      type: SchemaTypes.Number,
      required: true,
      min: 0,
    },
    unit: {
      type: SchemaTypes.String,
      trim: true,
      default: '',
    },
    discount: {
      type: SchemaTypes.Number,
      default: 0,
      min: 0,
    },
    status: {
      type: SchemaTypes.String,
      enum: Object.values(PRODUCTL_HOD_RATE_STATUS),
      default: PRODUCTL_HOD_RATE_STATUS.HOD_APPROVAL_PENDING,
      index: true,
    },
  },
  { timestamps: true, collection: 'productl_hod_rates' }
)

productlHodRatesSchema.index({ pro_code: 1, status: 1 })

productlHodRatesSchema.plugin(commonFieldsPlugin)

const ProductlHodRatesModel = mongoose.model(
  'productlHodRates',
  productlHodRatesSchema
)

export default ProductlHodRatesModel
