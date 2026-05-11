import mongoose from 'mongoose'
import { SchemaTypes } from '../core/common/schemaTypes.js'

const passwordResetRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: SchemaTypes.ObjectId,
      ref: 'employee',
      required: true,
      index: true,
    },
    message: {
      type: SchemaTypes.String,
      required: true,
      trim: true,
    },
    email: {
      type: SchemaTypes.String,
      required: true,
      trim: true,
      lowercase: true,
    },
    role: {
      type: SchemaTypes.String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
)

const PasswordResetRequestModel = mongoose.model(
  'password_reset_request',
  passwordResetRequestSchema
)

export default PasswordResetRequestModel
