import mongoose from 'mongoose'
import { SchemaTypes } from '../core/common/schemaTypes.js'

const rawQueryActivitySchema = new mongoose.Schema(
  {
    rawQueryId: {
      type: SchemaTypes.ObjectId,
      ref: 'rawQuery',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['viewed', 'action', 'follow_up'],
      required: true,
    },
    performedBy: {
      type: SchemaTypes.ObjectId,
      ref: 'employee',
      required: true,
    },
    meta: {
      action: { type: String, default: '' },
      followUpStatus: { type: String, default: '' },
      note: { type: String, default: '' },
    },
  },
  { timestamps: true }
)

rawQueryActivitySchema.index({ rawQueryId: 1, createdAt: -1 })

const RawQueryActivityModel = mongoose.model('rawQueryActivity', rawQueryActivitySchema)

export default RawQueryActivityModel
