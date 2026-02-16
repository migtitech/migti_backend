import mongoose from 'mongoose'
import { v4 as uuidv4 } from 'uuid'
import { commonFieldsPlugin } from './plugin/commonFields.plugin.js'
import { SchemaTypes } from '../core/common/schemaTypes.js'

const groupSchema = new mongoose.Schema(
  {
    uniqueId: {
      type: String,
      default: uuidv4,
    },
    name: {
      type: SchemaTypes.String,
      required: true,
      trim: true,
    },
    code: {
      type: SchemaTypes.String,
      trim: true,
      sparse: true,
    },
    description: {
      type: SchemaTypes.String,
      default: '',
    },
    status: {
      type: SchemaTypes.String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  {
    timestamps: true,
    autoIndex: false,
  },
)

groupSchema.plugin(commonFieldsPlugin)

const GroupModel = mongoose.model('group', groupSchema)

export default GroupModel
