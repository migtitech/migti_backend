import mongoose from 'mongoose'
import path from 'path'
import fs from 'fs'
import { SchemaTypes } from '../core/common/schemaTypes.js'

const documentSchema = new mongoose.Schema(
  {
    path: {
      type: SchemaTypes.String,
      required: true,
      unique: true,
      trim: true,
    },
    originalName: {
      type: SchemaTypes.String,
      default: '',
    },
    mimeType: {
      type: SchemaTypes.String,
      default: '',
    },
  },
  { timestamps: true },
)

const DocumentModel = mongoose.model('document', documentSchema)

/**
 * Ensure directory exists at runtime (creates recursively).
 * @param {string} dirPath - Relative path from process.cwd() (e.g. 'assets/products/xxx')
 */
export function ensureAssetsDir(dirPath) {
  const fullPath = path.join(process.cwd(), dirPath)
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true })
  }
  return fullPath
}

export default DocumentModel
