import mongoose from 'mongoose'
import { commonFieldsPlugin } from './plugin/commonFields.plugin.js'
import { SchemaTypes } from '../core/common/schemaTypes.js'

export const LOCAL_PROCUREMENT_STATUS = Object.freeze({
  PENDING: 'pending',
  SUBMITTED: 'submitted',
})

const localProcurementStatusValues = Object.values(LOCAL_PROCUREMENT_STATUS)

const localProcurementRateEntrySchema = new mongoose.Schema(
  {
    supplier: { type: SchemaTypes.String, trim: true, default: '' },
    price: { type: SchemaTypes.Number, min: 0, default: null },
    rate: { type: SchemaTypes.Number, required: true, min: 0 },
    unit: { type: SchemaTypes.String, trim: true, default: '' },
    remark: { type: SchemaTypes.String, default: '' },
    submittedAt: { type: Date, default: Date.now },
    submittedBy: {
      type: SchemaTypes.ObjectId,
      ref: 'employee',
      default: null,
    },
  },
  { _id: true }
)

const localProcurementImageEntrySchema = new mongoose.Schema(
  {
    documentId: {
      type: SchemaTypes.ObjectId,
      ref: 'document',
      default: null,
    },
    path: { type: SchemaTypes.String, default: '' },
    name: { type: SchemaTypes.String, trim: true, default: '' },
    mimeType: { type: SchemaTypes.String, trim: true, default: '' },
    uploadedAt: { type: Date, default: Date.now },
    uploadedBy: {
      type: SchemaTypes.ObjectId,
      ref: 'employee',
      default: null,
    },
  },
  { _id: true }
)

const localProcurementSchema = new mongoose.Schema(
  {
    queryProductId: {
      type: SchemaTypes.ObjectId,
      ref: 'queryProduct',
      required: true,
      index: true,
    },
    queryCode: {
      type: SchemaTypes.String,
      trim: true,
      default: '',
      index: true,
    },
    productSnapshot: {
      type: SchemaTypes.Mixed,
      default: {},
    },
    employeeId: {
      type: SchemaTypes.ObjectId,
      ref: 'employee',
      required: true,
      index: true,
    },
    assignedBy: {
      type: SchemaTypes.ObjectId,
      ref: 'employee',
      default: null,
    },
    assignmentRemark: {
      type: SchemaTypes.String,
      trim: true,
      default: '',
    },
    /** Latest submission snapshot (mirrors last rates[] entry) */
    supplier: {
      type: SchemaTypes.String,
      trim: true,
      default: '',
    },
    rate: {
      type: SchemaTypes.Number,
      min: 0,
      default: null,
    },
    unit: {
      type: SchemaTypes.String,
      trim: true,
      default: '',
    },
    remark: {
      type: SchemaTypes.String,
      trim: true,
      default: '',
    },
    rates: { type: [localProcurementRateEntrySchema], default: [] },
    images: { type: [localProcurementImageEntrySchema], default: [] },
    status: {
      type: SchemaTypes.String,
      enum: localProcurementStatusValues,
      default: LOCAL_PROCUREMENT_STATUS.PENDING,
      index: true,
    },
    branchId: {
      type: SchemaTypes.ObjectId,
      ref: 'companyBranch',
      default: null,
      index: true,
    },
  },
  { timestamps: true, collection: 'local_procurements' }
)

localProcurementSchema.plugin(commonFieldsPlugin)

const LocalProcurementModel = mongoose.model(
  'localProcurement',
  localProcurementSchema
)

export default LocalProcurementModel
