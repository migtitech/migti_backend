import mongoose from 'mongoose'
import { v4 as uuidv4 } from 'uuid'
import { commonFieldsPlugin } from './plugin/commonFields.plugin.js'
import { SchemaTypes } from '../core/common/schemaTypes.js'

const roleSchema = new mongoose.Schema(
  {
    uniqueId: {
      type: String,
      unique: true,
      default: uuidv4,
    },
    name: {
      type: SchemaTypes.String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: SchemaTypes.String,
      default: '',
    },
    permissions: [
      {
        type: SchemaTypes.String,
        required: true,
      },
    ],
  },
  { timestamps: true }
)

roleSchema.plugin(commonFieldsPlugin)

const RoleModel = mongoose.model('roles', roleSchema)

export default RoleModel
