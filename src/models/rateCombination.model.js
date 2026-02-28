import mongoose from 'mongoose'
import { v4 as uuidv4 } from 'uuid'
import { commonFieldsPlugin } from './plugin/commonFields.plugin.js'
import { SchemaTypes } from '../core/common/schemaTypes.js'

const rateCombinationSchema = new mongoose.Schema(
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
    combinationUniqueId: {
      type: SchemaTypes.String,
      required: true,
      trim: true,
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
  },
  { timestamps: true },
)

rateCombinationSchema.index({ product: 1, combinationUniqueId: 1, supplier: 1 }, { unique: true })
rateCombinationSchema.index({ product: 1, supplier: 1 })

rateCombinationSchema.plugin(commonFieldsPlugin)

const RateCombinationModel = mongoose.model('rateCombination', rateCombinationSchema)

export default RateCombinationModel
