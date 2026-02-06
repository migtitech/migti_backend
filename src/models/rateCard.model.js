import mongoose from 'mongoose'
import { v4 as uuidv4 } from 'uuid'
import { commonFieldsPlugin } from './plugin/commonFields.plugin.js'
import { SchemaTypes } from '../core/common/schemaTypes.js'

const rateCardSchema = new mongoose.Schema(
  {
    uniqueId: {
      type: String,    
      unique: true,
      default: uuidv4,
    },
    name: {
      type: SchemaTypes.String,
      required: true,
      trim: true,
    },
    description: {
      type: SchemaTypes.String,
      default: '',
    },
    type: {
      type: SchemaTypes.String,
      enum: ['fixed', 'percentage', 'tiered'],
      default: 'fixed',
    },
    value: {
      type: SchemaTypes.Number,
      default: 0,
      min: 0,
    },
    minOrderValue: {
      type: SchemaTypes.Number,
      default: 0,
      min: 0,
    },
    maxDiscount: {
      type: SchemaTypes.Number,
      default: 0,
      min: 0,
    },
    validFrom: {
      type: Date,
      default: null,
    },
    validTo: {
      type: Date,
      default: null,
    },
    applicableCategories: [
      {
        type: SchemaTypes.ObjectId,
        ref: 'category',
      },
    ],
    applicableProducts: [
      {
        type: SchemaTypes.ObjectId,
        ref: 'product',
      },
    ],
    status: {
      type: SchemaTypes.String,
      enum: ['active', 'inactive', 'expired'],
      default: 'active',
    },
    priority: {
      type: SchemaTypes.Number,
      default: 0,
    },
    suppliers: [
      {
        supplierName: { type: SchemaTypes.String, required: true, trim: true },
        rate: { type: SchemaTypes.Number, required: true, min: 0 },
        contact: { type: SchemaTypes.String, required: true, trim: true },
        notes: { type: SchemaTypes.String, default: '' },
      },
    ],
  },
  { timestamps: true },
)

rateCardSchema.plugin(commonFieldsPlugin)

const RateCardModel = mongoose.model('rateCard', rateCardSchema)

export default RateCardModel
