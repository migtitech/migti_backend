import mongoose from 'mongoose'
import { v4 as uuidv4 } from 'uuid'
import { commonFieldsPlugin } from './plugin/commonFields.plugin.js'
import { SchemaTypes } from '../core/common/schemaTypes.js'

const employeeLocationSchema = new mongoose.Schema(
  {
    uniqueId: {
      type: String,
      unique: true,
      default: uuidv4,
    },
    employeeId: {
      type: SchemaTypes.ObjectId,
      ref: 'employee',
      required: true,
      index: true,
    },
    latitude: {
      type: SchemaTypes.Number,
      required: true,
    },
    longitude: {
      type: SchemaTypes.Number,
      required: true,
    },
    locality: {
      type: SchemaTypes.String,
      trim: true,
      default: '',
    },
    city: {
      type: SchemaTypes.String,
      trim: true,
      default: '',
    },
    /** meters (from browser Geolocation `coords.accuracy`) */
    accuracyM: {
      type: SchemaTypes.Number,
      default: null,
    },
    created_by: {
      type: SchemaTypes.ObjectId,
      ref: 'employee',
      default: null,
    },
  },
  { timestamps: true },
)

employeeLocationSchema.plugin(commonFieldsPlugin)

const EmployeeLocationModel = mongoose.model('employeeLocation', employeeLocationSchema)

export default EmployeeLocationModel
