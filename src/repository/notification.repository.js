import NotificationModel from '../models/notification.model.js'

export const insertNotifications = (docs) => NotificationModel.insertMany(docs)

export const countNotifications = (filter) =>
  NotificationModel.countDocuments(filter)

export const findNotifications = (filter, skip, limit) =>
  NotificationModel.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()

export const updateNotification = (filter, update, options) =>
  NotificationModel.findOneAndUpdate(filter, update, options).lean()

export const updateManyNotifications = (filter, update) =>
  NotificationModel.updateMany(filter, update)

export const countUnreadNotifications = (filter) =>
  NotificationModel.countDocuments(filter)
