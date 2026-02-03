import mongoose from 'mongoose'
import { v4 as uuidv4 } from 'uuid'
import { commonFieldsPlugin } from './plugin/commonFields.plugin.js'
import { SchemaTypes } from '../core/common/schemaTypes.js'

const variantOptionValueSchema = new mongoose.Schema(
  {
    variantName: {
      type: SchemaTypes.String,
      required: true,
    },
    variantValue: {
      type: SchemaTypes.String,
      required: true,
    },
  },
  { _id: false },
)

const variantCombinationSchema = new mongoose.Schema(
  {
    uniqueId: {
      type: String,
      default: uuidv4,
    },
    optionValues: [variantOptionValueSchema],
    sku: {
      type: SchemaTypes.String,
      required: true,
    },
    price: {
      type: SchemaTypes.Number,
      required: true,
      min: 0,
    },
    mrp: {
      type: SchemaTypes.Number,
      default: 0,
      min: 0,
    },
    costPrice: {
      type: SchemaTypes.Number,
      default: 0,
      min: 0,
    },
    quantity: {
      type: SchemaTypes.Number,
      default: 0,
      min: 0,
    },
    images: [{ type: SchemaTypes.String }],
    isActive: {
      type: SchemaTypes.Boolean,
      default: true,
    },
  },
  { _id: true },
)

const variantSchema = new mongoose.Schema(
  {
    name: {
      type: SchemaTypes.String,
      required: true,
    },
    options: [
      {
        type: SchemaTypes.String,
        required: true,
      },
    ],
  },
  { _id: false },
)

const productSchema = new mongoose.Schema(
  {
    uniqueId: {
      type: String,
      unique: true,
      default: uuidv4,
    },
    name: {
      type: SchemaTypes.String,
      required: true,
      trim: true,
    },
    slug: {
      type: SchemaTypes.String,
      unique: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: SchemaTypes.String,
      default: '',
    },
    shortDescription: {
      type: SchemaTypes.String,
      default: '',
    },
    sku: {
      type: SchemaTypes.String,
      required: true,
      unique: true,
      trim: true,
    },
    category: {
      type: SchemaTypes.ObjectId,
      ref: 'category',
      required: true,
    },
    subcategory: {
      type: SchemaTypes.ObjectId,
      ref: 'category',
      default: null,
    },
    brand: {
      type: SchemaTypes.ObjectId,
      ref: 'brand',
      default: null,
    },
    price: {
      type: SchemaTypes.Number,
      required: true,
      min: 0,
    },
    mrp: {
      type: SchemaTypes.Number,
      default: 0,
      min: 0,
    },
    costPrice: {
      type: SchemaTypes.Number,
      default: 0,
      min: 0,
    },
    quantity: {
      type: SchemaTypes.Number,
      default: 0,
      min: 0,
    },
    hasVariants: {
      type: SchemaTypes.Boolean,
      default: false,
    },
    variants: [variantSchema],
    variantCombinations: [variantCombinationSchema],
    images: [{ type: SchemaTypes.String }],
    weight: {
      type: SchemaTypes.Number,
      default: 0,
    },
    weightUnit: {
      type: SchemaTypes.String,
      enum: ['g', 'kg', 'lb', 'oz'],
      default: 'g',
    },
    dimensions: {
      length: { type: SchemaTypes.Number, default: 0 },
      width: { type: SchemaTypes.Number, default: 0 },
      height: { type: SchemaTypes.Number, default: 0 },
    },
    dimensionUnit: {
      type: SchemaTypes.String,
      enum: ['cm', 'in', 'm'],
      default: 'cm',
    },
    tags: [
      {
        type: SchemaTypes.String,
        trim: true,
      },
    ],
    status: {
      type: SchemaTypes.String,
      enum: ['active', 'inactive', 'draft'],
      default: 'draft',
    },
    unit: {
      type: SchemaTypes.String,
      default: 'pcs',
    },
  },
  { timestamps: true },
)

productSchema.plugin(commonFieldsPlugin)

const ProductModel = mongoose.model('product', productSchema)

export default ProductModel
