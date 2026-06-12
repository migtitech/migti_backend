import mongoose from 'mongoose'
import { commonFieldsPlugin } from './plugin/commonFields.plugin.js'
import { SchemaTypes } from '../core/common/schemaTypes.js'

const companyDocumentSchema = new mongoose.Schema(
  {
    name: {
      type: SchemaTypes.String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    doc_type: {
      type: SchemaTypes.String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    remark: {
      type: SchemaTypes.String,
      default: '',
      trim: true,
      maxlength: 1000,
    },
    documentId: {
      type: SchemaTypes.ObjectId,
      ref: 'document',
      required: true,
    },
    createdBy: {
      type: SchemaTypes.ObjectId,
      ref: 'employee',
      default: null,
    },
  },
  { timestamps: true }
)

companyDocumentSchema.plugin(commonFieldsPlugin)

const CompanyDocumentModel = mongoose.model(
  'companyDocument',
  companyDocumentSchema
)

export default CompanyDocumentModel
