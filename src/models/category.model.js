import mongoose from 'mongoose'
import { v4 as uuidv4 } from 'uuid'
import { commonFieldsPlugin } from './plugin/commonFields.plugin.js'
import { SchemaTypes } from '../core/common/schemaTypes.js'

const categorySchema = new mongoose.Schema(
  {
    uniqueId: {
      type: String,
      default: uuidv4,
    },
    categoryCode: {
      type: SchemaTypes.String,
      trim: true,
      sparse: true,
    },
    name: {
      type: SchemaTypes.String,
      required: true,
      trim: true,
    },
    slug: {
      type: SchemaTypes.String,
      trim: true,
      lowercase: true,
    },
    description: {
      type: SchemaTypes.String,
      default: '',
    },
    group: {
      type: SchemaTypes.ObjectId,
      ref: 'group',
      default: null,
    },
    parent: {
      type: SchemaTypes.ObjectId,
      ref: 'category',
      default: null,
    },
    image: {
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

categorySchema.plugin(commonFieldsPlugin)

const CategoryModel = mongoose.model('category', categorySchema)

export default CategoryModel
