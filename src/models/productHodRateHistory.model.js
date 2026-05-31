import mongoose from 'mongoose'
import { commonFieldsPlugin } from './plugin/commonFields.plugin.js'
import { SchemaTypes } from '../core/common/schemaTypes.js'
import { PRODUCTL_HOD_RATE_STATUS } from './productlHodRates.model.js'

const productHodRateHistorySchema = new mongoose.Schema(
  {
    queryCode: {
      type: SchemaTypes.String,
      trim: true,
      required: true,
      index: true,
    },
    queryId: {
      type: SchemaTypes.ObjectId,
      ref: 'query',
      required: true,
      index: true,
    },
    queryProductId: {
      type: SchemaTypes.ObjectId,
      ref: 'queryProduct',
      required: true,
      index: true,
    },
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
      default: PRODUCTL_HOD_RATE_STATUS.HOD_APPROVED,
      index: true,
    },
    updatedBy: {
      type: SchemaTypes.ObjectId,
      ref: 'employee',
      default: null,
    },
  },
  { timestamps: true, collection: 'product_hod_rate_histories' }
)

productHodRateHistorySchema.index({ queryCode: 1, pro_code: 1, createdAt: -1 })

productHodRateHistorySchema.plugin(commonFieldsPlugin)

const ProductHodRateHistoryModel = mongoose.model(
  'productHodRateHistory',
  productHodRateHistorySchema
)

export default ProductHodRateHistoryModel
