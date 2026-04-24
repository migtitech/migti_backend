import mongoose from 'mongoose'
import { commonFieldsPlugin } from './plugin/commonFields.plugin.js'
import { SchemaTypes } from '../core/common/schemaTypes.js'

export const TASK_STATUS = {
  DRAFT: 'draft',
  ASSIGNED: 'assigned',
  SUBMITTED: 'submitted',
}

export const TASK_PRIORITY = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
}

const taskStatusValues = Object.values(TASK_STATUS)
const taskPriorityValues = Object.values(TASK_PRIORITY)

const productInfoSchema = new mongoose.Schema(
  {
    name: { type: SchemaTypes.String, trim: true, default: '' },
    hsn: { type: SchemaTypes.String, trim: true, default: '' },
    gst: { type: SchemaTypes.Number, min: 0, max: 100, default: null },
    modelNumber: { type: SchemaTypes.String, trim: true, default: '' },
    description: { type: SchemaTypes.String, trim: true, default: '' },
    image: { type: SchemaTypes.ObjectId, ref: 'document', default: null },
  },
  { _id: false }
)

const supplierInfoSchema = new mongoose.Schema(
  {
    supplierId: { type: SchemaTypes.ObjectId, ref: 'supplier', default: null },
    supplierName: { type: SchemaTypes.String, trim: true, default: '' },
    contactName: { type: SchemaTypes.String, trim: true, default: '' },
    contactPhone: { type: SchemaTypes.String, trim: true, default: '' },
    contactEmail: { type: SchemaTypes.String, trim: true, default: '' },
    rate: { type: SchemaTypes.Number, min: 0, default: null },
    currency: { type: SchemaTypes.String, trim: true, default: 'INR' },
    remark: { type: SchemaTypes.String, trim: true, default: '' },
    updatedBy: { type: SchemaTypes.ObjectId, ref: 'employee', default: null },
    updatedAt: { type: SchemaTypes.Date, default: null },
  },
  { _id: false }
)

const taskManagementSchema = new mongoose.Schema(
  {
    title: {
      type: SchemaTypes.String,
      required: true,
      trim: true,
    },
    employeeId: {
      type: SchemaTypes.ObjectId,
      ref: 'employee',
      default: null,
      index: true,
    },
    branchId: {
      type: SchemaTypes.ObjectId,
      ref: 'companyBranch',
      default: null,
      index: true,
    },
    productInfo: {
      type: productInfoSchema,
      default: () => ({}),
    },
    supplierInfo: {
      type: supplierInfoSchema,
      default: () => ({}),
    },
    remark: {
      type: SchemaTypes.String,
      trim: true,
      default: '',
    },
    targetRate: {
      type: SchemaTypes.Number,
      min: 0,
      default: null,
    },
    dueDate: {
      type: SchemaTypes.Date,
      default: null,
    },
    priority: {
      type: SchemaTypes.String,
      enum: taskPriorityValues,
      default: TASK_PRIORITY.MEDIUM,
    },
    status: {
      type: SchemaTypes.String,
      enum: taskStatusValues,
      default: TASK_STATUS.DRAFT,
      index: true,
    },
    submissionDate: {
      type: SchemaTypes.Date,
      default: null,
    },
    assignedDate: {
      type: SchemaTypes.Date,
      default: null,
    },
  },
  { timestamps: true }
)

taskManagementSchema.plugin(commonFieldsPlugin)

const TaskManagementModel = mongoose.model(
  'taskManagement',
  taskManagementSchema
)

export default TaskManagementModel
