import { Message, statusCodes, errorCodes } from '../../core/common/constant.js'
import CustomError from '../../utils/exception.js'
import {
  listNotificationsSchema,
  createNotificationsSchema,
  notificationIdParamSchema,
} from '../../validator/notification/notification.validator.js'
import {
  listNotificationsForUser,
  markNotificationRead,
  markAllNotificationsRead,
  notifyEmployeesByBranchRoles,
} from '../../services/notification/notification.service.js'

const getActorUserId = (req) => req.user?.id || req.user?._id

const parseUnreadOnly = (value) => {
  if (value === true || value === 'true' || value === '1') return true
  if (value === false || value === 'false' || value === '0') return false
  return false
}

const BROADCAST_ROLES = new Set(['superadmin', 'admin', 'head_of_department'])

const canBroadcastNotifications = (req) => {
  const role = String(req.user?.role || '').toLowerCase()
  return BROADCAST_ROLES.has(role)
}

export const listNotificationsController = async (req, res) => {
  const { error, value } = listNotificationsSchema.validate(req.query, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const userId = getActorUserId(req)
  if (!userId) {
    return res.status(statusCodes.unauthorized).json({
      success: false,
      message: 'User id missing from token',
    })
  }

  const result = await listNotificationsForUser({
    userId,
    unreadOnly: parseUnreadOnly(value.unreadOnly),
    pageNumber: value.pageNumber,
    pageSize: value.pageSize,
  })

  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Notifications retrieved',
    data: result,
  })
}

export const createNotificationsController = async (req, res) => {
  if (!canBroadcastNotifications(req)) {
    return res.status(statusCodes.forbidden).json({
      success: false,
      message: 'Not allowed to create notifications',
    })
  }

  const { error, value } = createNotificationsSchema.validate(req.body, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const io = req.app.get('io')
  const result = await notifyEmployeesByBranchRoles({
    branchId: value.branchId,
    roles: value.roles,
    title: value.title,
    description: value.description ?? '',
    io,
    metadata: {},
  })

  return res.status(statusCodes.created).json({
    success: true,
    message: 'Notifications sent',
    data: result,
  })
}

export const markNotificationReadController = async (req, res) => {
  const { error, value } = notificationIdParamSchema.validate(req.params, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const userId = getActorUserId(req)
  if (!userId) {
    return res.status(statusCodes.unauthorized).json({
      success: false,
      message: 'User id missing from token',
    })
  }

  const updated = await markNotificationRead({
    notificationId: value.id,
    userId,
  })

  if (!updated) {
    throw new CustomError(
      statusCodes.notFound,
      'Notification not found',
      errorCodes.not_found
    )
  }

  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Notification marked read',
    data: updated,
  })
}

export const markAllNotificationsReadController = async (req, res) => {
  const userId = getActorUserId(req)
  if (!userId) {
    return res.status(statusCodes.unauthorized).json({
      success: false,
      message: 'User id missing from token',
    })
  }

  const result = await markAllNotificationsRead({ userId })

  return res.status(statusCodes.ok).json({
    success: true,
    message: 'All notifications marked read',
    data: result,
  })
}
