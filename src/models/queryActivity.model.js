import mongoose from 'mongoose'
import { SchemaTypes } from '../core/common/schemaTypes.js'

const queryActivitySchema = new mongoose.Schema(
  {
    queryId: {
      type: SchemaTypes.ObjectId,
      ref: 'query',
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
  { timestamps: true },
)

queryActivitySchema.index({ queryId: 1, createdAt: -1 })

const QueryActivityModel = mongoose.model('queryActivity', queryActivitySchema)

export default QueryActivityModel
