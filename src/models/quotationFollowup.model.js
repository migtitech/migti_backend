import mongoose from 'mongoose'
import { commonFieldsPlugin } from './plugin/commonFields.plugin.js'
import { SchemaTypes } from '../core/common/schemaTypes.js'

export const QUOTATION_FOLLOWUP_STATUS = {
  PENDING: 'pending',
  FOLLOWED_UP: 'followed_up',
  CLOSED: 'closed',
}

const followupDate2DaysFromNow = () => {
  const d = new Date()
  d.setDate(d.getDate() + 2)
  return d
}

const followupHistoryEntrySchema = new mongoose.Schema(
  {
    sequence: { type: SchemaTypes.Number, required: true, min: 1 },
    remark: { type: SchemaTypes.String, trim: true, required: true },
    followedUpBy: {
      type: SchemaTypes.ObjectId,
      ref: 'employee',
      default: null,
    },
    followedUpAt: {
      type: SchemaTypes.Date,
      default: Date.now,
    },
  },
  { _id: true }
)

const quotationFollowupSchema = new mongoose.Schema(
  {
    quotationId: {
      type: SchemaTypes.ObjectId,
      ref: 'quotation',
      required: true,
      index: true,
    },
    quotationCode: {
      type: SchemaTypes.String,
      trim: true,
      default: '',
      index: true,
    },
    /** Quotation status at follow-up creation / last sync. */
    status: {
      type: SchemaTypes.String,
      trim: true,
      default: '',
    },
    /** Follow-up workflow status — updated when a remark is added. */
    followupStatus: {
      type: SchemaTypes.String,
      enum: Object.values(QUOTATION_FOLLOWUP_STATUS),
      default: QUOTATION_FOLLOWUP_STATUS.PENDING,
      index: true,
    },
    followup_date: {
      type: SchemaTypes.Date,
      default: followupDate2DaysFromNow,
      index: true,
    },
    remark: {
      type: SchemaTypes.String,
      trim: true,
      default: '',
    },
    /** Number of completed follow-ups (1, 2, 3, …). */
    followupCount: {
      type: SchemaTypes.Number,
      default: 0,
      min: 0,
    },
    followupHistory: {
      type: [followupHistoryEntrySchema],
      default: [],
    },
    zoneId: {
      type: SchemaTypes.ObjectId,
      ref: 'area',
      default: null,
      index: true,
    },
    industry_id: {
      type: SchemaTypes.ObjectId,
      ref: 'industry',
      default: null,
    },
    companyName: {
      type: SchemaTypes.String,
      trim: true,
      default: '',
    },
    salesEmployeeId: {
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
  },
  { timestamps: true, collection: 'quotation_followup' }
)

quotationFollowupSchema.plugin(commonFieldsPlugin)

const QuotationFollowupModel = mongoose.model(
  'quotationFollowup',
  quotationFollowupSchema
)

export default QuotationFollowupModel
