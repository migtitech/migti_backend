import mongoose from 'mongoose'
import { v4 as uuidv4 } from 'uuid'
import { commonFieldsPlugin } from './plugin/commonFields.plugin.js'
import { SchemaTypes } from '../core/common/schemaTypes.js'

const supplierSchema = new mongoose.Schema(
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
    shopname: {
      type: SchemaTypes.String,
      trim: true,
      default: '',
    },
    address: {
      type: SchemaTypes.String,
      default: '',
    },
    phone_1: {
      type: SchemaTypes.String,
      trim: true,
      default: '',
    },
    phone_2: {
      type: SchemaTypes.String,
      trim: true,
      default: '',
    },
    email: {
      type: SchemaTypes.String,
      trim: true,
      lowercase: true,
      default: '',
    },
    other_contact: {
      type: SchemaTypes.String,
      trim: true,
      default: '',
    },
    label: {
      type: SchemaTypes.String,
      trim: true,
      default: '',
    },
    shop_location: {
      type: SchemaTypes.String,
      trim: true,
      default: '',
    },
    gst: {
      type: SchemaTypes.String,
      trim: true,
      uppercase: true,
      default: '',
    },
    categories: [
      {
        type: SchemaTypes.ObjectId,
        ref: 'category',
      },
    ],
    remark: {
      type: SchemaTypes.String,
      default: '',
    },
  },
  { timestamps: true },
)

supplierSchema.plugin(commonFieldsPlugin)

const SupplierModel = mongoose.model('supplier', supplierSchema)

export default SupplierModel
