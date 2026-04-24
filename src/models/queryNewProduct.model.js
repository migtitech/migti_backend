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
