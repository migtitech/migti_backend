import mongoose from 'mongoose'
import { v4 as uuidv4 } from 'uuid'
import { commonFieldsPlugin } from './plugin/commonFields.plugin.js'
import { SchemaTypes } from '../core/common/schemaTypes.js'

const billingEntrySchema = new mongoose.Schema(
  {
    uniqueId: {
      type: String,
      unique: true,
      default: uuidv4,
    },
    billingNumber: {
      type: SchemaTypes.String,
      trim: true,
      uppercase: true,
      default: '',
      index: true,
    },
    companyId: {
      type: SchemaTypes.ObjectId,
      ref: 'industry',
      required: true,
      index: true,
    },
    salespersonId: {
      type: SchemaTypes.ObjectId,
      ref: 'employee',
      required: true,
      index: true,
    },
    amount: {
      type: SchemaTypes.Number,
      required: true,
      min: 0,
      default: 0,
    },
    entryDate: {
      type: SchemaTypes.Date,
      required: true,
      default: Date.now,
      index: true,
    },
    branchId: {
      type: SchemaTypes.ObjectId,
      ref: 'companyBranch',
      default: null,
      index: true,
    },
    created_by: {
      type: SchemaTypes.ObjectId,
      ref: 'employee',
      default: null,
    },
    remark: {
      type: SchemaTypes.String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true },
)

billingEntrySchema.plugin(commonFieldsPlugin)

const BillingEntryModel = mongoose.model('billingEntry', billingEntrySchema)

export default BillingEntryModel
