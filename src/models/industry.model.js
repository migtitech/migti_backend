import mongoose from 'mongoose'
import { v4 as uuidv4 } from 'uuid'
import { commonFieldsPlugin } from './plugin/commonFields.plugin.js'
import { SchemaTypes } from '../core/common/schemaTypes.js'

const industrySchema = new mongoose.Schema(
  {
    uniqueId: {
      type: String,
      unique: true,
      default: uuidv4,
    },
    name: {
      type: SchemaTypes.String,
      required: true,
      trim: true,
    },
    area: {
      type: SchemaTypes.ObjectId,
      ref: 'area',
      default: null,
    },
    location: {
      type: SchemaTypes.String,
      trim: true,
      default: '',
    },
    address: {
      type: SchemaTypes.String,
      default: '',
    },
    purchase_manager_name: {
      type: SchemaTypes.String,
      trim: true,
      default: '',
    },
    purchase_manager_phone: {
      type: SchemaTypes.String,
      trim: true,
      default: '',
    },
    email: {
      type: SchemaTypes.String,
      trim: true,
      lowercase: true,
      default: '',
    },
  },
  { timestamps: true },
)

industrySchema.plugin(commonFieldsPlugin)

const IndustryModel = mongoose.model('industry', industrySchema)

export default IndustryModel
