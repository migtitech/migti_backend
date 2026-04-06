import mongoose from 'mongoose'
import { v4 as uuidv4 } from 'uuid'
import { commonFieldsPlugin } from './plugin/commonFields.plugin.js'
import { SchemaTypes } from '../core/common/schemaTypes.js'

const targetAnalyticsHistorySchema = new mongoose.Schema(
  {
    uniqueId: {
      type: String,
      unique: true,
      default: uuidv4,
    },
    sourceTargetId: {
      type: SchemaTypes.ObjectId,
      ref: 'targetAnalytics',
      required: true,
      index: true,
    },
    branchId: {
      type: SchemaTypes.ObjectId,
      ref: 'companyBranch',
      required: true,
      index: true,
    },
    period: {
      type: SchemaTypes.String,
      enum: ['weekly', 'monthly'],
      required: true,
    },
    dateFrom: {
      type: SchemaTypes.Date,
      required: true,
    },
    dateTo: {
      type: SchemaTypes.Date,
      required: true,
      index: true,
    },
    targetAmount: {
      type: SchemaTypes.Number,
      required: true,
      min: 0,
      default: 0,
    },
    actualBillingAmount: {
      type: SchemaTypes.Number,
      required: true,
      min: 0,
      default: 0,
    },
    actualPoAmount: {
      type: SchemaTypes.Number,
      required: true,
      min: 0,
      default: 0,
    },
    analyticsSnapshot: {
      totalQueries: { type: SchemaTypes.Number, default: 0 },
      totalQuotation: { type: SchemaTypes.Number, default: 0 },
      totalPo: { type: SchemaTypes.Number, default: 0 },
      totalBilling: { type: SchemaTypes.Number, default: 0 },
      quotedAmount: { type: SchemaTypes.Number, default: 0 },
      poAmount: { type: SchemaTypes.Number, default: 0 },
      billingAmount: { type: SchemaTypes.Number, default: 0 },
    },
    archivedAt: {
      type: SchemaTypes.Date,
      required: true,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
)

targetAnalyticsHistorySchema.plugin(commonFieldsPlugin)

const TargetAnalyticsHistoryModel = mongoose.model(
  'targetAnalyticsHistory',
  targetAnalyticsHistorySchema
)

export default TargetAnalyticsHistoryModel
