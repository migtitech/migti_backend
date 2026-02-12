import mongoose from 'mongoose'
import { v4 as uuidv4 } from 'uuid'
import { commonFieldsPlugin } from './plugin/commonFields.plugin.js'
import { SchemaTypes } from '../core/common/schemaTypes.js'

const imageSchema = new mongoose.Schema(
  {
    uniqueId: {
      type: String,
      unique: true,
      default: uuidv4,
    },
    imageUrl: {
      type: SchemaTypes.String,
      required: true,
      trim: true,
    },
    s3Key: {
      type: SchemaTypes.String,
      default: null,
      trim: true,
    },
    signedUrl: {
      type: SchemaTypes.String,
      default: null,
      trim: true,
    },
    imageType: {
      type: SchemaTypes.String,
      enum: ['product', 'variant', 'user', 'banner', 'category', 'brand'],
      default: 'product',
    },
    referenceId: {
      type: SchemaTypes.ObjectId,
      required: true,
      index: true,
    },
    variantCombinationUniqueId: {
      type: SchemaTypes.String,
      default: null,
    },
  },
  { timestamps: true },
)

imageSchema.index({ referenceId: 1, imageType: 1 })
imageSchema.index({ referenceId: 1, imageType: 1, variantCombinationUniqueId: 1 })

imageSchema.plugin(commonFieldsPlugin)

const ImageModel = mongoose.model('image', imageSchema)

export default ImageModel
