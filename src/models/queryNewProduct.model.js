import mongoose from 'mongoose'
import { v4 as uuidv4 } from 'uuid'
import { commonFieldsPlugin } from './plugin/commonFields.plugin.js'
import { SchemaTypes } from '../core/common/schemaTypes.js'

const queryNewProductSchema = new mongoose.Schema(
  {
    uniqueId: {
      type: String,
      default: uuidv4,
    },
    name: {
      type: SchemaTypes.String,
      required: true,
      trim: true,
    },
    qty: {
      type: SchemaTypes.Number,
      min: 0,
      default: 1,
    },
    groupId: {
      type: SchemaTypes.ObjectId,
      ref: 'group',
      default: null,
    },
    categoryId: {
      type: SchemaTypes.ObjectId,
      ref: 'category',
      default: null,
    },
    /** Next value from shared productCode sequence (e.g. mig1001) */
    rawProductCode: {
      type: SchemaTypes.String,
      trim: true,
      default: '',
    },
    /** From codesequences.ritems (QTRK1000) */
    query_tracking_code: {
      type: SchemaTypes.String,
      trim: true,
      default: '',
    },
    description: {
      type: SchemaTypes.String,
      trim: true,
      default: '',
    },
    unit: {
      type: SchemaTypes.String,
      trim: true,
      default: '',
    },
    hsnNumber: {
      type: SchemaTypes.String,
      trim: true,
      default: '',
    },
    modelNumber: {
      type: SchemaTypes.String,
      trim: true,
      default: '',
    },
    variants: {
      type: [SchemaTypes.String],
      default: [],
    },
    images: [
      {
        type: SchemaTypes.ObjectId,
        ref: 'document',
      },
    ],
  },
  {
    timestamps: true,
  }
)

queryNewProductSchema.plugin(commonFieldsPlugin)

const QueryNewProductModel = mongoose.model(
  'query_new_product',
  queryNewProductSchema
)

export default QueryNewProductModel
