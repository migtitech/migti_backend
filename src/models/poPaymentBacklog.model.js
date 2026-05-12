import mongoose from 'mongoose'
import { commonFieldsPlugin } from './plugin/commonFields.plugin.js'
import { SchemaTypes } from '../core/common/schemaTypes.js'

const dueDate35DaysFromNow = () => {
  const d = new Date()
  d.setDate(d.getDate() + 35)
  return d
}

const poPaymentBacklogSchema = new mongoose.Schema(
  {
    /** Full PO document snapshot captured at HOD-approval time. */
    po_snapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    branchId: {
      type: SchemaTypes.ObjectId,
      ref: 'companyBranch',
      default: null,
      index: true,
    },
    /** Grand total (incl. GST, freight, packing) computed at approval time. */
    amount: {
      type: SchemaTypes.Number,
      required: true,
      min: 0,
      default: 0,
    },
    /** Sales employee associated with this PO at approval time. */
    employeeId: {
      type: SchemaTypes.ObjectId,
      ref: 'employee',
      default: null,
      index: true,
    },
    /** Snapshot of the client (industry / company) at approval time. */
    clients_snapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    /** Payment due date: HOD-approval date + 35 calendar days. */
    due_date: {
      type: SchemaTypes.Date,
      default: dueDate35DaysFromNow,
    },
    /** False until the backlog entry is manually settled. */
    is_settled: {
      type: SchemaTypes.Boolean,
      default: false,
    },
    /** Reference back to the source purchase order. */
    purchaseOrderId: {
      type: SchemaTypes.ObjectId,
      ref: 'purchaseOrder',
      required: true,
      index: true,
    },
  },
  { timestamps: true, collection: 'po_payment_backlog' }
)

poPaymentBacklogSchema.plugin(commonFieldsPlugin)

const PoPaymentBacklogModel = mongoose.model(
  'poPaymentBacklog',
  poPaymentBacklogSchema
)

export default PoPaymentBacklogModel
