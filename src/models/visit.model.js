import mongoose from 'mongoose'
import { v4 as uuidv4 } from 'uuid'
import { commonFieldsPlugin } from './plugin/commonFields.plugin.js'
import { SchemaTypes } from '../core/common/schemaTypes.js'

const visitSchema = new mongoose.Schema(
  {
    uniqueId: {
      type: String,
      unique: true,
      default: uuidv4,
    },
    branchId: {
      type: SchemaTypes.ObjectId,
      ref: 'companyBranch',
      required: true,
      index: true,
    },
    zoneId: {
      type: SchemaTypes.ObjectId,
      ref: 'area',
      required: true,
      index: true,
    },
    employeeId: {
      type: SchemaTypes.ObjectId,
      ref: 'employee',
      required: true,
      index: true,
    },
    industryIds: {
      type: [
        {
          type: SchemaTypes.ObjectId,
          ref: 'industry',
        },
      ],
      required: true,
      default: [],
    },
    instructions: {
      type: SchemaTypes.String,
      trim: true,
      default: '',
    },
    status: {
      type: SchemaTypes.String,
      enum: ['active', 'completed'],
      default: 'active',
      index: true,
    },
    remark: {
      type: SchemaTypes.String,
      trim: true,
      default: '',
    },
    created_by: {
      type: SchemaTypes.ObjectId,
      ref: 'employee',
      default: null,
    },
  },
  { timestamps: true },
)

visitSchema.plugin(commonFieldsPlugin)

const VisitModel = mongoose.model('visit', visitSchema)

export default VisitModel
