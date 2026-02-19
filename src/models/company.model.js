import mongoose from 'mongoose'
import { v4 as uuidv4 } from 'uuid'
import { commonFieldsPlugin } from './plugin/commonFields.plugin.js'
import { SchemaTypes } from '../core/common/schemaTypes.js'

const companySchema = new mongoose.Schema(
  {
    uniqueId: {
      type: String,
      unique: true,
      default: uuidv4,
    },
    name: {
      type: SchemaTypes.String,
      required: true,
    },
    logoUrl: {
      type: SchemaTypes.String,
      default: 'https://migti.co.in/assets/images/logo.png',
    },
    email: {
      type: SchemaTypes.String,
      required: true,
      unique: true,
    },
    password: {
      type: SchemaTypes.String,
      required: false,
      default: null,
    },
    brandName: {
      type: SchemaTypes.String,
      required: true,
    },
    gst: {
      type: SchemaTypes.String,
      default: '',
    },
    mobile: {
      type: SchemaTypes.String,
      trim: true,
      default: '',
    },
    address: {
      type: SchemaTypes.String,
      default: '',
    },
    website: {
      type: SchemaTypes.String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
)

companySchema.plugin(commonFieldsPlugin)

const CompanyModel = mongoose.model('company', companySchema)

export default CompanyModel
