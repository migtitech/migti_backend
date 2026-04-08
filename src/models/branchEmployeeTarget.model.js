import mongoose from 'mongoose'
import { v4 as uuidv4 } from 'uuid'
import { commonFieldsPlugin } from './plugin/commonFields.plugin.js'
import { SchemaTypes } from '../core/common/schemaTypes.js'

const branchEmployeeTargetSchema = new mongoose.Schema(
  {
    uniqueId: { type: String, unique: true, default: uuidv4 },
    branchId: { type: SchemaTypes.ObjectId, ref: 'companyBranch', required: true, index: true },
    zoneId: { type: SchemaTypes.ObjectId, ref: 'area', default: null, index: true },
    employeeId: { type: SchemaTypes.ObjectId, ref: 'employee', required: true, index: true },
    period: { type: SchemaTypes.String, enum: ['weekly', 'monthly'], required: true, default: 'weekly' },
    dateFrom: { type: SchemaTypes.Date, required: true, index: true },
    dateTo: { type: SchemaTypes.Date, required: true, index: true },
    targetAmount: { type: SchemaTypes.Number, required: true, min: 0, default: 0 },
    created_by: { type: SchemaTypes.ObjectId, ref: 'employee', default: null },
    updated_by: { type: SchemaTypes.ObjectId, ref: 'employee', default: null },
  },
  { timestamps: true }
)

branchEmployeeTargetSchema.plugin(commonFieldsPlugin)
branchEmployeeTargetSchema.index(
  { branchId: 1, employeeId: 1, period: 1, dateFrom: 1, dateTo: 1, isDeleted: 1 },
  { unique: true }
)

export default mongoose.model('branchEmployeeTarget', branchEmployeeTargetSchema)
