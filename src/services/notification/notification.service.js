import mongoose from 'mongoose'
import EmployeeModel from '../../models/employee.model.js'
import NotificationModel from '../../models/notification.model.js'

export const serializeNotificationDoc = (doc) => {
  const o = doc?.toObject ? doc.toObject() : doc
  if (!o) return null
  return {
    _id: o._id,
    title: o.title,
    description: o.description,
    isRead: Boolean(o.isRead),
    readAt: o.readAt || null,
    metadata: o.metadata && typeof o.metadata === 'object' ? o.metadata : {},
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  }
}

/**
 * Resolve employees by branch + roles, insert one notification per user, emit socket events.
 */
export const notifyEmployeesByBranchRoles = async ({
  branchId,
  roles,
  title,
  description,
  io,
  metadata = {},
}) => {
  if (!title || !branchId || !Array.isArray(roles) || roles.length === 0) {
    return { created: [], count: 0 }
  }

  const bid = mongoose.Types.ObjectId.isValid(String(branchId))
    ? new mongoose.Types.ObjectId(String(branchId))
    : null
  if (!bid) return { created: [], count: 0 }

  const employees = await EmployeeModel.find({
    branchId: bid,
    role: { $in: roles },
    isDeleted: false,
  })
    .select('_id')
    .lean()

  if (!employees.length) return { created: [], count: 0 }

  const meta = {
    ...metadata,
    branchId: bid.toString(),
  }

  const docs = employees.map((e) => ({
    userId: e._id,
    title: String(title).trim(),
    description: String(description ?? '').trim(),
    isRead: false,
    metadata: meta,
  }))

  const inserted = await NotificationModel.insertMany(docs)

  if (io) {
    for (const doc of inserted) {
      const payload = serializeNotificationDoc(doc)
      io.to(`user:${String(doc.userId)}`).emit('notification:new', payload)
    }
  }

  return {
    created: inserted.map((d) => serializeNotificationDoc(d)),
    count: inserted.length,
  }
}

export const listNotificationsForUser = async ({
  userId,
  unreadOnly = false,
  pageNumber = 1,
  pageSize = 20,
}) => {
  if (!userId || !mongoose.Types.ObjectId.isValid(String(userId))) {
    return { items: [], totalItems: 0, pageNumber: 1, pageSize: 20 }
  }
  const uid = new mongoose.Types.ObjectId(String(userId))
  const page = Math.max(1, parseInt(pageNumber, 10) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 20))
  const skip = (page - 1) * limit

  const filter = { userId: uid }
  if (unreadOnly) filter.isRead = false

  const totalItems = await NotificationModel.countDocuments(filter)
  const rows = await NotificationModel.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()

  return {
    items: rows.map((r) => serializeNotificationDoc(r)),
    totalItems,
    pageNumber: page,
    pageSize: limit,
  }
}

export const markNotificationRead = async ({ notificationId, userId }) => {
  if (
    !notificationId ||
    !userId ||
    !mongoose.Types.ObjectId.isValid(String(notificationId)) ||
    !mongoose.Types.ObjectId.isValid(String(userId))
  ) {
    return null
  }
  const nid = new mongoose.Types.ObjectId(String(notificationId))
  const uid = new mongoose.Types.ObjectId(String(userId))

  const updated = await NotificationModel.findOneAndUpdate(
    { _id: nid, userId: uid },
    { $set: { isRead: true, readAt: new Date() } },
    { new: true }
  ).lean()

  return updated ? serializeNotificationDoc(updated) : null
}

export const markAllNotificationsRead = async ({ userId }) => {
  if (!userId || !mongoose.Types.ObjectId.isValid(String(userId))) {
    return { modifiedCount: 0 }
  }
  const uid = new mongoose.Types.ObjectId(String(userId))
  const result = await NotificationModel.updateMany(
    { userId: uid, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  )
  return { modifiedCount: result.modifiedCount ?? 0 }
}

export const countUnreadForUser = async (userId) => {
  if (!userId || !mongoose.Types.ObjectId.isValid(String(userId))) return 0
  const uid = new mongoose.Types.ObjectId(String(userId))
  return NotificationModel.countDocuments({ userId: uid, isRead: false })
}
