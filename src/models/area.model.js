import mongoose from 'mongoose'
import { v4 as uuidv4 } from 'uuid'
import { commonFieldsPlugin } from './plugin/commonFields.plugin.js'
import { SchemaTypes } from '../core/common/schemaTypes.js'

const areaSchema = new mongoose.Schema(
  {
    uniqueId: {
      type: String,
      default: uuidv4,
    },
    companyId: {
      type: SchemaTypes.ObjectId,
      ref: 'company',
      required: true,
    },
    branchId: {
      type: SchemaTypes.ObjectId,
      ref: 'companyBranch',
      required: true,
    },
    name: {
      type: SchemaTypes.String,
      required: true,
      trim: true,
    },
    city: {
      type: SchemaTypes.String,
      required: true,
      trim: true,
    },
    areaType: {
      type: SchemaTypes.String,
      enum: ['market', 'industry'],
      required: true,
    },
  },
  { timestamps: true }
)

areaSchema.plugin(commonFieldsPlugin)

const AreaModel = mongoose.model('area', areaSchema)

export default AreaModel
