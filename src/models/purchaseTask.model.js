import mongoose from 'mongoose'
import { commonFieldsPlugin } from './plugin/commonFields.plugin.js'
import { SchemaTypes } from '../core/common/schemaTypes.js'

export const PURCHASE_TASK_STATUS = {
  ASSIGNED: 'assigned',
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  SUBMITTED: 'submitted',
  SETTLED: 'settled',
}

export const PURCHASE_TASK_PRIORITY = {
  HIGHEST: 'highest',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
}

export const PURCHASE_TASK_TYPE = {
  QUOTATION: 'quotation',
}

const purchaseTaskStatusValues = Object.values(PURCHASE_TASK_STATUS)
const purchaseTaskPriorityValues = Object.values(PURCHASE_TASK_PRIORITY)
const purchaseTaskTypeValues = Object.values(PURCHASE_TASK_TYPE)

const purchaseTaskSchema = new mongoose.Schema(
  {
    type: {
      type: SchemaTypes.String,
      enum: purchaseTaskTypeValues,
      default: PURCHASE_TASK_TYPE.QUOTATION,
    },
    priority: {
      type: SchemaTypes.String,
      enum: purchaseTaskPriorityValues,
      default: PURCHASE_TASK_PRIORITY.HIGHEST,
    },
    quotationId: {
      type: SchemaTypes.ObjectId,
      ref: 'quotation',
      required: true,
      index: true,
    },
    quotationNumber: {
      type: SchemaTypes.String,
      trim: true,
      default: '',
    },
    assignedTo: {
      type: SchemaTypes.ObjectId,
      ref: 'employee',
      required: true,
      index: true,
    },
    assignedBy: {
      type: SchemaTypes.ObjectId,
      ref: 'employee',
      required: true,
    },
    product: {
      type: SchemaTypes.Mixed,
      default: {},
    },
    productCategory: {
      type: SchemaTypes.String,
      trim: true,
      default: '',
    },
    productGroup: {
      type: SchemaTypes.String,
      trim: true,
      default: '',
    },
    subCategory: {
      type: SchemaTypes.String,
      trim: true,
      default: '',
    },
    targetRate: {
      type: SchemaTypes.Number,
      min: 0,
      default: 0,
    },
    procurementRate: {
      type: SchemaTypes.Number,
      min: 0,
      default: null,
    },
    dueDate: {
      type: SchemaTypes.Date,
      default: null,
    },
    supplierRateRemark: {
      type: SchemaTypes.String,
      trim: true,
      default: '',
    },
    status: {
      type: SchemaTypes.String,
      enum: purchaseTaskStatusValues,
      default: PURCHASE_TASK_STATUS.ASSIGNED,
      index: true,
    },
    branchId: {
      type: SchemaTypes.ObjectId,
      ref: 'companyBranch',
      default: null,
      index: true,
    },
  },
  { timestamps: true }
)

purchaseTaskSchema.plugin(commonFieldsPlugin)

const PurchaseTaskModel = mongoose.model('purchaseTask', purchaseTaskSchema)

export default PurchaseTaskModel
