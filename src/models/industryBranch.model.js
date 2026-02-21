import mongoose from 'mongoose'
import { v4 as uuidv4 } from 'uuid'
import { commonFieldsPlugin } from './plugin/commonFields.plugin.js'
import { SchemaTypes } from '../core/common/schemaTypes.js'

const industryBranchSchema = new mongoose.Schema(
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
    location: {
      type: SchemaTypes.String,
      trim: true,
      default: '',
    },
    address: {
      type: SchemaTypes.String,
      default: '',
    },
    gst: {
      type: SchemaTypes.String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true },
)

industryBranchSchema.index({ industryId: 1, isDeleted: 1 })
industryBranchSchema.plugin(commonFieldsPlugin)

const IndustryBranchModel = mongoose.model('industryBranch', industryBranchSchema)

export default IndustryBranchModel
