import mongoose from 'mongoose'
import { v4 as uuidv4 } from 'uuid'
import { commonFieldsPlugin } from './plugin/commonFields.plugin.js'
import { SchemaTypes } from '../core/common/schemaTypes.js'
const superAdminSchema = new mongoose.Schema(
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
        password: {
            type: SchemaTypes.String,
            required: true,
        },
    },
    { timestamps: true }
)

superAdminSchema.plugin(commonFieldsPlugin)

const SuperAdminModel = mongoose.model('superadmin', superAdminSchema)

export default SuperAdminModel
