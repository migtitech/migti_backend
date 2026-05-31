import mongoose from 'mongoose'
import { commonFieldsPlugin } from './plugin/commonFields.plugin.js'
import { SchemaTypes } from '../core/common/schemaTypes.js'

export const LOCAL_PURCHASE_STATUS = Object.freeze({
  PENDING: 'pending',
  SUBMITTED: 'submitted',
})

const localPurchaseStatusValues = Object.values(LOCAL_PURCHASE_STATUS)

const localPurchaseDocumentEntrySchema = new mongoose.Schema(
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

const localPurchaseSchema = new mongoose.Schema(
  {
    poProductId: {
      type: SchemaTypes.ObjectId,
      ref: 'poProduct',
      required: true,
      index: true,
    },
    poCode: {
      type: SchemaTypes.String,
      trim: true,
      default: '',
      index: true,
    },
    queryCode: {
      type: SchemaTypes.String,
      trim: true,
      default: '',
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
    supplier: {
      type: SchemaTypes.String,
      trim: true,
      default: '',
    },
    remark: {
      type: SchemaTypes.String,
      default: '',
    },
    locationLink: {
      type: SchemaTypes.String,
      trim: true,
      default: '',
    },
    bill: {
      type: localPurchaseDocumentEntrySchema,
      default: null,
    },
    productImages: {
      type: [localPurchaseDocumentEntrySchema],
      default: [],
    },
    submissionRemark: {
      type: SchemaTypes.String,
      trim: true,
      default: '',
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    submittedBy: {
      type: SchemaTypes.ObjectId,
      ref: 'employee',
      default: null,
    },
    status: {
      type: SchemaTypes.String,
      enum: localPurchaseStatusValues,
      default: LOCAL_PURCHASE_STATUS.PENDING,
      index: true,
    },
    branchId: {
      type: SchemaTypes.ObjectId,
      ref: 'companyBranch',
      default: null,
      index: true,
    },
  },
  { timestamps: true, collection: 'local_purchases' }
)

localPurchaseSchema.plugin(commonFieldsPlugin)

const LocalPurchaseModel = mongoose.model('localPurchase', localPurchaseSchema)

export default LocalPurchaseModel
