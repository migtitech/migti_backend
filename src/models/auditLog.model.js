import mongoose from 'mongoose'
import { SchemaTypes } from '../core/common/schemaTypes.js'

const auditLogSchema = new mongoose.Schema(
  {
    eventType: {
      type: SchemaTypes.String,
      required: true,
      index: true,
      default: 'jwt_auth',
    },
    outcome: {
      type: SchemaTypes.String,
      enum: ['success', 'failure'],
      required: true,
      index: true,
    },
    /** Full JWT claims after verify (user identity from token). */
    jwtPayload: { type: SchemaTypes.Mixed, default: null },
    /** SHA-256 of the bearer token (correlation without storing the secret). */
    tokenHash: { type: SchemaTypes.String, default: '', index: true },
    /**
     * Raw access token — only stored when AUDIT_LOG_STORE_RAW_JWT=true.
     * Avoid enabling in production unless required by policy.
     */
    jwtAccessToken: { type: SchemaTypes.String, default: '' },
    route: {
      type: SchemaTypes.Mixed,
      default: () => ({}),
    },
    request: {
      type: SchemaTypes.Mixed,
      default: () => ({}),
    },
    client: {
      type: SchemaTypes.Mixed,
      default: () => ({}),
    },
    server: {
      type: SchemaTypes.Mixed,
      default: () => ({}),
    },
    failure: {
      type: SchemaTypes.Mixed,
      default: null,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

auditLogSchema.index({ createdAt: -1 })

const AuditLogModel = mongoose.model('auditLog', auditLogSchema, 'audit_log')

export default AuditLogModel
