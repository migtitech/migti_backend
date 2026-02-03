import mongoose from 'mongoose'
import { v4 as uuidv4 } from 'uuid'
import { commonFieldsPlugin } from './plugin/commonFields.plugin.js'
import { SchemaTypes } from '../core/common/schemaTypes.js'

const rawQuerySchema = new mongoose.Schema(
  {
    uniqueId: {
      type: String,
      unique: true,
      default: uuidv4,
    },
    priority: {
      type: SchemaTypes.String,
      required: true,
    },
    title: {
      type: SchemaTypes.String,
      required: true,
    },
    company_info: {
      type: SchemaTypes.String,
      required: true,
    },
    supplier_id: {
      type: SchemaTypes.ObjectId,
      ref: 'supplier',
      default: null,
    },
    description: {
      type: SchemaTypes.String,
      required: true,
    },
    files: {
      type: SchemaTypes.Array,
      default: [],
    },
    created_by: {
      type: SchemaTypes.ObjectId,
      ref: 'employee',
      required: true,
    },
  },
  { timestamps: true }
)

rawQuerySchema.plugin(commonFieldsPlugin)

const RawQueryModel = mongoose.model('rawQuery', rawQuerySchema)

export default RawQueryModel
