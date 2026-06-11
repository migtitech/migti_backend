import mongoose from 'mongoose'
import { findEmployeesByRoles } from '../../repository/employee.repository.js'
import {
  countNotifications,
  countUnreadNotifications,
  findNotifications,
  insertNotifications,
  updateManyNotifications,
  updateNotification,
} from '../../repository/notification.repository.js'

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
 * Resolve employee ObjectIds by roles (and optional branch). Pure read helper, no side effects.
 *
 * @param {Object} args
 * @param {string[]} args.roles - role keys (e.g. ['head_of_department'])
 * @param {string|mongoose.Types.ObjectId} [args.branchId] - optional branch filter
 * @returns {Promise<mongoose.Types.ObjectId[]>}
 */
export const getEmployeeIdsByRoles = async ({ roles, branchId } = {}) => {
  if (!Array.isArray(roles) || roles.length === 0) return []

  const filter = {
    role: { $in: roles },
    isDeleted: false,
  }

  if (branchId !== undefined && branchId !== null && branchId !== '') {
    if (!mongoose.Types.ObjectId.isValid(String(branchId))) return []
    filter.branchId = new mongoose.Types.ObjectId(String(branchId))
  }

  const employees = await findEmployeesByRoles(filter)
  return employees.map((e) => e._id)
}

/**
 * Insert one notification per employeeId and emit `notification:new` to each user's room.
 *
 * @param {Object} args
 * @param {string} args.title
 * @param {string} [args.description]
 * @param {Array<string|mongoose.Types.ObjectId>} args.employeeIds
 * @param {import('socket.io').Server} [args.io]
 * @param {Object} [args.metadata]
 * @returns {Promise<{ created: Array, count: number }>}
 */
export const createNotifications = async ({
  title,
  description = '',
  employeeIds,
  io,
  metadata = {},
} = {}) => {
  if (!title || !Array.isArray(employeeIds) || employeeIds.length === 0) {
    return { created: [], count: 0 }
  }

  const validIds = []
  for (const id of employeeIds) {
    if (!id) continue
    const s = String(id)
    if (!mongoose.Types.ObjectId.isValid(s)) continue
    validIds.push(new mongoose.Types.ObjectId(s))
  }
  if (!validIds.length) return { created: [], count: 0 }

  const meta = metadata && typeof metadata === 'object' ? metadata : {}

  const docs = validIds.map((uid) => ({
    userId: uid,
    title: String(title).trim(),
    description: String(description ?? '').trim(),
    isRead: false,
    metadata: meta,
  }))

  const inserted = await insertNotifications(docs)

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

/**
 * Resolve employees by branch + roles, insert one notification per user, emit socket events.
 * Composes `getEmployeeIdsByRoles` + `createNotifications`.
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

  const employeeIds = await getEmployeeIdsByRoles({ roles, branchId })
  if (!employeeIds.length) return { created: [], count: 0 }

  return createNotifications({
    title,
    description,
    employeeIds,
    io,
    metadata: {
      ...(metadata && typeof metadata === 'object' ? metadata : {}),
      branchId: String(branchId),
    },
  })
}

const HOD_ROLES = ['head_of_department']

/** Notify branch HODs (DB + optional realtime). Errors are swallowed so callers are not blocked. */
export const notifyBranchHods = async (
  io,
  branchId,
  title,
  description = '',
  metadata = {}
) => {
  if (!branchId || !title) return
  try {
    await notifyEmployeesByBranchRoles({
      branchId,
      roles: HOD_ROLES,
      title: String(title).trim(),
      description: String(description ?? '').trim(),
      io: io || null,
      metadata: metadata && typeof metadata === 'object' ? metadata : {},
    })
  } catch {
    // non-blocking for business flows
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

  const totalItems = await countNotifications(filter)
  const rows = await findNotifications(filter, skip, limit)

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

  const updated = await updateNotification(
    { _id: nid, userId: uid },
    { $set: { isRead: true, readAt: new Date() } },
    { new: true }
  )

  return updated ? serializeNotificationDoc(updated) : null
}

export const markAllNotificationsRead = async ({ userId }) => {
  if (!userId || !mongoose.Types.ObjectId.isValid(String(userId))) {
    return { modifiedCount: 0 }
  }
  const uid = new mongoose.Types.ObjectId(String(userId))
  const result = await updateManyNotifications(
    { userId: uid, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  )
  return { modifiedCount: result.modifiedCount ?? 0 }
}

export const countUnreadForUser = async (userId) => {
  if (!userId || !mongoose.Types.ObjectId.isValid(String(userId))) return 0
  const uid = new mongoose.Types.ObjectId(String(userId))
  return countUnreadNotifications({ userId: uid, isRead: false })
}
