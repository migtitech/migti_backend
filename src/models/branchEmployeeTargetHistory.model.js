import mongoose from 'mongoose'
import { v4 as uuidv4 } from 'uuid'
import { commonFieldsPlugin } from './plugin/commonFields.plugin.js'
import { SchemaTypes } from '../core/common/schemaTypes.js'

const branchEmployeeTargetHistorySchema = new mongoose.Schema(
  {
    uniqueId: { type: String, unique: true, default: uuidv4 },
    sourceTargetId: { type: SchemaTypes.ObjectId, ref: 'branchEmployeeTarget', required: true, index: true },
    branchId: { type: SchemaTypes.ObjectId, ref: 'companyBranch', required: true, index: true },
    zoneId: { type: SchemaTypes.ObjectId, ref: 'area', default: null, index: true },
    employeeId: { type: SchemaTypes.ObjectId, ref: 'employee', required: true, index: true },
    period: { type: SchemaTypes.String, enum: ['weekly', 'monthly'], required: true },
    dateFrom: { type: SchemaTypes.Date, required: true },
    dateTo: { type: SchemaTypes.Date, required: true, index: true },
    targetAmount: { type: SchemaTypes.Number, required: true, min: 0, default: 0 },
    actualBillingAmount: { type: SchemaTypes.Number, required: true, min: 0, default: 0 },
    archivedAt: { type: SchemaTypes.Date, required: true, default: Date.now, index: true },
  },
  { timestamps: true }
)

branchEmployeeTargetHistorySchema.plugin(commonFieldsPlugin)

export default mongoose.model('branchEmployeeTargetHistory', branchEmployeeTargetHistorySchema)
