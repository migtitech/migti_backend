import mongoose from 'mongoose'
import { v4 as uuidv4 } from 'uuid'

// Common Schema Types
export const SchemaTypes = Object.freeze({
  ObjectId: mongoose.Schema.Types.ObjectId,
  String: String,
  Number: Number,
  Date: Date,
  Boolean: Boolean,
  Array: Array,
  Mixed: mongoose.Schema.Types.Mixed,
})

// Common Schema Field Definitions
export const CommonFields = Object.freeze({
  uniqueId: {
    type: String,
    unique: true,
    default: () => uuidv4(),
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
})

export const createReferenceField = (refModel, required = true) => ({
  type: SchemaTypes.ObjectId,
  ref: refModel,
  required,
})
