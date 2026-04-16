import mongoose from 'mongoose'
import { v4 as uuidv4 } from 'uuid'
import { commonFieldsPlugin } from './plugin/commonFields.plugin.js'
import { SchemaTypes } from '../core/common/schemaTypes.js'

const subZoneSchema = new mongoose.Schema(
  {
    uniqueId: {
      type: String,
      default: uuidv4,
    },
    zoneId: {
      type: SchemaTypes.ObjectId,
      ref: 'area',
      required: true,
      index: true,
    },
    subZoneCode: {
      type: SchemaTypes.String,
      required: true,
      trim: true,
    },
    name: {
      type: SchemaTypes.String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 200,
    },
  },
  { timestamps: true },
)

subZoneSchema.plugin(commonFieldsPlugin)

subZoneSchema.index(
  { zoneId: 1, subZoneCode: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } },
)

const SubZoneModel = mongoose.model('subZone', subZoneSchema)

export default SubZoneModel
