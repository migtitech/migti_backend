import mongoose from 'mongoose'
import { SchemaTypes } from '../core/common/schemaTypes.js'

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: SchemaTypes.ObjectId,
      ref: 'employee',
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date, default: null },
    metadata: { type: SchemaTypes.Mixed, default: {} },
  },
  { timestamps: true }
)

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 })

const NotificationModel = mongoose.model('notification', notificationSchema)

export default NotificationModel
