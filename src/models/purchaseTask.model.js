import mongoose from 'mongoose'
import { commonFieldsPlugin } from './plugin/commonFields.plugin.js'
import { SchemaTypes } from '../core/common/schemaTypes.js'

export const PURCHASE_TASK_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  SUBMITTED: 'submitted',
  SETTLED: 'settled',
}

const purchaseTaskStatusValues = Object.values(PURCHASE_TASK_STATUS)

const purchaseTaskSchema = new mongoose.Schema(
  {
    quotationId: {
      type: SchemaTypes.ObjectId,
      ref: 'quotation',
      required: true,
      index: true,
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
      default: PURCHASE_TASK_STATUS.PENDING,
      index: true,
    },
    branchId: {
      type: SchemaTypes.ObjectId,
      ref: 'companyBranch',
      default: null,
      index: true,
    },
  },
  { timestamps: true },
)

purchaseTaskSchema.plugin(commonFieldsPlugin)

const PurchaseTaskModel = mongoose.model('purchaseTask', purchaseTaskSchema)

export default PurchaseTaskModel

