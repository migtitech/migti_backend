import mongoose from 'mongoose'
import { v4 as uuidv4 } from 'uuid'
import { commonFieldsPlugin } from './plugin/commonFields.plugin.js'
import { SchemaTypes } from '../core/common/schemaTypes.js'

const bankDetailsSchema = new mongoose.Schema(
  {
    accountNumber: { type: String, default: '' },
    ifscCode: { type: String, default: '' },
    bankName: { type: String, default: '' },
    accountHolderName: { type: String, default: '' },
    upiDetails: { type: String, default: '' },
  },
  { _id: false }
)

const assetItemSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: false },
    model: { type: String, default: '' },
    modelNumber: { type: String, default: '' },
    companyName: { type: String, default: '' },
    vehicleNumber: { type: String, default: '' },
    configurationRam: { type: String, default: '' },
    configurationRom: { type: String, default: '' },
    storageType: { type: String, default: '' },
    phoneType: { type: String, default: '' },
    imeiNumber: { type: String, default: '' },
    number: { type: String, default: '' },
    providedDate: { type: String, default: '' },
  },
  { _id: false }
)

const assetsSchema = new mongoose.Schema(
  {
    bike: { type: assetItemSchema, default: () => ({}) },
    laptop: { type: assetItemSchema, default: () => ({}) },
    mobile: { type: assetItemSchema, default: () => ({}) },
    simCard: { type: assetItemSchema, default: () => ({}) },
  },
  { _id: false }
)

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
    fatherName: { type: SchemaTypes.String, default: '' },
    motherName: { type: SchemaTypes.String, default: '' },
    pincode: { type: SchemaTypes.String, default: '' },
    hasBike: { type: SchemaTypes.String, default: 'no' },
    hasDrivingLicense: { type: SchemaTypes.String, default: 'no' },
    companyEmail: { type: SchemaTypes.String, default: '' },
    companyPhone: { type: SchemaTypes.String, default: '' },
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
    salaryType: { type: SchemaTypes.String, default: 'monthly' },
    salary: { type: SchemaTypes.Number, default: 0 },
    password: {
      type: SchemaTypes.String,
      required: true,
    },
    branchId: {
      type: SchemaTypes.ObjectId,
      ref: 'companyBranch',
      required: true,
    },
    bankDetails: { type: bankDetailsSchema, default: () => ({}) },
    assets: { type: assetsSchema, default: () => ({}) },
  },
  { timestamps: true }
)

employeeSchema.plugin(commonFieldsPlugin)

const EmployeeModel = mongoose.model('employee', employeeSchema)

export default EmployeeModel
