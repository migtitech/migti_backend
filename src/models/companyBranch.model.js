import mongoose from 'mongoose'
import { v4 as uuidv4 } from 'uuid'
import { commonFieldsPlugin } from './plugin/commonFields.plugin.js'
import { SchemaTypes } from '../core/common/schemaTypes.js'

const companyBranchSchema = new mongoose.Schema(
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
    companyId: {
      type: SchemaTypes.ObjectId,
      ref: 'company',
      required: true,
    },
    adminId: {
      type: SchemaTypes.ObjectId,
      ref: 'admin',
      required: false,
    },
    email: {
      type: SchemaTypes.String,
      required: true,
    },
    branchcode: {
      type: SchemaTypes.String,
      required: true,
    },
    phone: {
      type: SchemaTypes.String,
      required: true,
    },
    address: {
      type: SchemaTypes.String,
      required: true,
    },
    gstNumber: {
      type: SchemaTypes.String,
      required: true,
    },
    fullAddress: {
      type: SchemaTypes.String,
      required: true,
    },
    mapLocationUrl: {
      type: SchemaTypes.String,
      required: false,
    },
  },
  { timestamps: true }
)

companyBranchSchema.plugin(commonFieldsPlugin)

const CompanyBranchModel = mongoose.model('companyBranch', companyBranchSchema)

export default CompanyBranchModel
