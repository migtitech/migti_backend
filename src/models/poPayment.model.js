import mongoose from 'mongoose'
import { commonFieldsPlugin } from './plugin/commonFields.plugin.js'
import { SchemaTypes } from '../core/common/schemaTypes.js'

const poPaymentLedgerEntrySchema = new mongoose.Schema(
  {
    amount: { type: SchemaTypes.Number, required: true, min: 0 },
    paidAt: { type: SchemaTypes.Date, required: true, default: Date.now },
    remark: { type: SchemaTypes.String, trim: true, default: '' },
    paymentProofDocumentId: {
      type: SchemaTypes.ObjectId,
      ref: 'document',
      default: null,
    },
    recordedBy: {
      type: SchemaTypes.ObjectId,
      ref: 'employee',
      default: null,
    },
  },
  { _id: true }
)

const poPaymentSchema = new mongoose.Schema(
  {
    /** One row per purchase order. */
    purchaseOrderId: {
      type: SchemaTypes.ObjectId,
      ref: 'purchaseOrder',
      required: true,
      unique: true,
      index: true,
    },
    /** Point-in-time copy of key PO data for the payment view (refreshed on new ledger entry). */
    poSnapshot: { type: mongoose.Schema.Types.Mixed, default: null },
    snapshotAt: { type: SchemaTypes.Date, default: null },
    /** Payments received from the company — ledger. */
    ledgers: { type: [poPaymentLedgerEntrySchema], default: [] },
  },
  { timestamps: true, collection: 'po_payments' }
)

poPaymentSchema.plugin(commonFieldsPlugin)

const PoPaymentModel = mongoose.model('poPayment', poPaymentSchema)

export { poPaymentLedgerEntrySchema, poPaymentSchema }
export default PoPaymentModel
