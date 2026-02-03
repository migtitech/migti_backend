import NotificationModel from '../../models/notification.model.js'
import { Message, statusCodes, errorCodes } from '../common/constant.js'
import CustomError from '../../utils/exception.js'

class NotificationQueue {
  constructor() {
    this.queue = []
    this.isProcessing = false
  }

  // Add notification to queue
  addToQueue(notificationData) {
    this.queue.push({
      ...notificationData,
      timestamp: new Date(),
    })
    
    // Process queue if not already processing
    if (!this.isProcessing) {
      this.processQueue()
    }
  }

  // Process the notification queue
  async processQueue() {
    if (this.isProcessing || this.queue.length === 0) {
      return
    }

    this.isProcessing = true

    while (this.queue.length > 0) {
      const notificationData = this.queue.shift()
      
      try {
        await this.createNotification(notificationData)
      } catch (error) {
        console.error('Error processing notification:', error)
        // Optionally, you could re-queue failed notifications
      }
    }

    this.isProcessing = false
  }

  // Create notification in database
  async createNotification(notificationData) {
    const { userId, title, description, type = 'info', priority = 'medium', metadata = {} } = notificationData

    // Validate required fields
    if (!userId || !title || !description) {
      throw new CustomError(
        statusCodes.badRequest,
        'Missing required notification fields',
        errorCodes.validation_error
      )
    }

    const notification = new NotificationModel({
      userId,
      title,
      description,
      type,
      priority,
      metadata,
    })

    await notification.save()
    return notification
  }

  // Batch create notifications
  async createBatchNotifications(notificationsData) {
    const validNotifications = notificationsData.filter(notification => 
      notification.userId && notification.title && notification.description
    )

    if (validNotifications.length === 0) {
      throw new CustomError(
        statusCodes.badRequest,
        'No valid notifications to create',
        errorCodes.validation_error
      )
    }

    const notifications = await NotificationModel.insertMany(validNotifications)
    return notifications
  }

  // Get queue status
  getQueueStatus() {
    return {
      queueLength: this.queue.length,
      isProcessing: this.isProcessing,
    }
  }

  // Clear queue (for testing purposes)
  clearQueue() {
    this.queue = []
  }
}

// Create singleton instance
const notificationQueue = new NotificationQueue()

// Export utility functions for easy use throughout the application
export const addNotification = (notificationData) => {
  notificationQueue.addToQueue(notificationData)
}

export const addBatchNotifications = async (notificationsData) => {
  return await notificationQueue.createBatchNotifications(notificationsData)
}

export const getQueueStatus = () => {
  return notificationQueue.getQueueStatus()
}

export const clearNotificationQueue = () => {
  notificationQueue.clearQueue()
}

export default notificationQueue
