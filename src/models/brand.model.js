import mongoose from 'mongoose'
import { v4 as uuidv4 } from 'uuid'
import { commonFieldsPlugin } from './plugin/commonFields.plugin.js'
import { SchemaTypes } from '../core/common/schemaTypes.js'

const brandSchema = new mongoose.Schema(
  {
    uniqueId: {
      type: String,
      unique: true,
      default: uuidv4,
    },
    name: {
      type: SchemaTypes.String,
      required: true,
      unique: true,
      trim: true,
    },
    slug: {
      type: SchemaTypes.String,
      unique: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: SchemaTypes.String,
      default: '',
    },
    status: {
      type: SchemaTypes.String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  { timestamps: true },
)

brandSchema.plugin(commonFieldsPlugin)

const BrandModel = mongoose.model('brand', brandSchema)

export default BrandModel
