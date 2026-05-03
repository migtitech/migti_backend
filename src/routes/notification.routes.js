import { Router } from 'express'
import { asyncHandler } from '../utils/asyncWrapper.js'
import { authenticateToken } from '../middlewares/jwtAuth.js'
import {
  listNotificationsController,
  createNotificationsController,
  markNotificationReadController,
  markAllNotificationsReadController,
} from '../controller/notification/notification.controller.js'

const notificationRouter = Router()

notificationRouter.get(
  '/',
  authenticateToken,
  asyncHandler(listNotificationsController)
)

notificationRouter.post(
  '/create',
  authenticateToken,
  asyncHandler(createNotificationsController)
)

notificationRouter.patch(
  '/:id/read',
  authenticateToken,
  asyncHandler(markNotificationReadController)
)

notificationRouter.post(
  '/mark-all-read',
  authenticateToken,
  asyncHandler(markAllNotificationsReadController)
)

export default notificationRouter
