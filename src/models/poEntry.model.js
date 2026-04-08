import mongoose from 'mongoose'
import { v4 as uuidv4 } from 'uuid'
import { commonFieldsPlugin } from './plugin/commonFields.plugin.js'
import { SchemaTypes } from '../core/common/schemaTypes.js'

const poEntrySchema = new mongoose.Schema(
  {
    uniqueId: {
      type: String,
      unique: true,
      default: uuidv4,
    },
    poNumber: {
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
    attachmentDocumentId: {
      type: SchemaTypes.ObjectId,
      ref: 'document',
      default: null,
    },
  },
  { timestamps: true },
)

poEntrySchema.plugin(commonFieldsPlugin)

const PoEntryModel = mongoose.model('poEntry', poEntrySchema)

export default PoEntryModel
