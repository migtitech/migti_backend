import mongoose from 'mongoose'
import { SchemaTypes } from '../core/common/schemaTypes.js'

const quotationSnapshotSchema = new mongoose.Schema(
  {
    quotationId: {
      type: SchemaTypes.ObjectId,
      ref: 'quotation',
      required: true,
      index: true,
    },
    revision: {
      type: Number,
      required: true,
      min: 1,
    },
    snapshotCode: {
      type: SchemaTypes.String,
      required: true,
      trim: true,
      unique: true,
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    approvedBy: {
      type: SchemaTypes.ObjectId,
      ref: 'employee',
      default: null,
    },
  },
  { timestamps: true },
)

quotationSnapshotSchema.index({ quotationId: 1, revision: 1 }, { unique: true })

const QuotationSnapshotModel = mongoose.model('quotationSnapshot', quotationSnapshotSchema)

export default QuotationSnapshotModel
