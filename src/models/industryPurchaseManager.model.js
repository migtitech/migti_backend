import mongoose from 'mongoose'
import { v4 as uuidv4 } from 'uuid'
import { commonFieldsPlugin } from './plugin/commonFields.plugin.js'
import { SchemaTypes } from '../core/common/schemaTypes.js'

const industryPurchaseManagerSchema = new mongoose.Schema(
  {
    uniqueId: {
      type: String,
      unique: true,
      default: uuidv4,
    },
    industryId: {
      type: SchemaTypes.ObjectId,
      ref: 'industry',
      required: true,
    },
    name: {
      type: SchemaTypes.String,
      required: true,
      trim: true,
    },
    phone: {
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

industryPurchaseManagerSchema.index({ industryId: 1, isDeleted: 1 })
industryPurchaseManagerSchema.plugin(commonFieldsPlugin)

const IndustryPurchaseManagerModel = mongoose.model(
  'industryPurchaseManager',
  industryPurchaseManagerSchema,
)

export default IndustryPurchaseManagerModel
