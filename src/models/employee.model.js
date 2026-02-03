import mongoose from 'mongoose'
import { v4 as uuidv4 } from 'uuid'
import { commonFieldsPlugin } from './plugin/commonFields.plugin.js'
import { SchemaTypes } from '../core/common/schemaTypes.js'

const employeeSchema = new mongoose.Schema(
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
    email: {
      type: SchemaTypes.String,
      required: true,
      unique: true,
    },
    phone: {
      type: SchemaTypes.String,
      required: true,
    },
    role: {
      type: SchemaTypes.String,
      required: true,
    },
    designation: {
      type: SchemaTypes.String,
      required: true,
    },
    address: {
      type: SchemaTypes.String,
      required: true,
    },
    idnumber: {
      type: SchemaTypes.String,
      required: true,
      unique: true,
    },
    password: {
      type: SchemaTypes.String,
      required: true,
    },
    branchId: {
      type: SchemaTypes.ObjectId,
      ref: 'companyBranch',
      required: true,
    },
  },
  { timestamps: true }
)

employeeSchema.plugin(commonFieldsPlugin)

const EmployeeModel = mongoose.model('employee', employeeSchema)

export default EmployeeModel
