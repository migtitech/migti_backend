import mongoose from 'mongoose'
import { v4 as uuidv4 } from 'uuid'
import { commonFieldsPlugin } from './plugin/commonFields.plugin.js'
import { SchemaTypes } from '../core/common/schemaTypes.js'

const rateCardSchema = new mongoose.Schema(
  {
    uniqueId: {
      type: String,
      unique: true,
      default: uuidv4,
    },
    product: {
      type: SchemaTypes.ObjectId,
      ref: 'product',
      required: true,
    },
    supplier: {
      type: SchemaTypes.ObjectId,
      ref: 'supplier',
      required: true,
    },
    rate: {
      type: SchemaTypes.Number,
      required: true,
      min: 0,
    },
    includeGst: {
      type: SchemaTypes.Boolean,
      default: false,
    },
    gstPercentage: {
      type: SchemaTypes.Number,
      default: 0,
      min: 0,
      max: 100,
    },
    notes: {
      type: SchemaTypes.String,
      default: '',
    },
  },
  { timestamps: true },
)

rateCardSchema.index({ product: 1, supplier: 1 }, { unique: true })

rateCardSchema.plugin(commonFieldsPlugin)

const RateCardModel = mongoose.model('rateCard', rateCardSchema)

export default RateCardModel
