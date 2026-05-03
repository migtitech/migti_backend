import cron from 'node-cron'
import logger from '../../core/config/logger.js'
import { runDatabaseBackup } from './databaseBackup.service.js'

let backupCronJob = null
let backupRunning = false

const isBackupEnabled = () =>
  process.env.MONGODB_BACKUP_ENABLED !== 'false' &&
  process.env.MONGODB_BACKUP_ENABLED !== '0'

const getCronExpression = () =>
  process.env.MONGODB_BACKUP_CRON?.trim() || '* * * * *'

export const startDatabaseBackupCron = () => {
  if (backupCronJob || !isBackupEnabled()) {
    if (!isBackupEnabled()) {
      logger.info('Database backup cron is disabled (set MONGODB_BACKUP_ENABLED=false)')
    }
    return
  }

  const expression = getCronExpression()
  backupCronJob = cron.schedule(
    expression,
    async () => {
      if (backupRunning) {
        logger.warn('Database backup skipped: previous run still in progress')
        return
      }
      backupRunning = true
      try {
        await runDatabaseBackup()
      } catch (error) {
        logger.error(`Database backup failed: ${error.message}`)
      } finally {
        backupRunning = false
      }
    },
    { timezone: process.env.MONGODB_BACKUP_TZ || 'Asia/Kolkata' }
  )

  logger.info(`Database backup cron started (${expression})`)
}

export const stopDatabaseBackupCron = async () => {
  if (!backupCronJob) return
  backupCronJob.stop()
  backupCronJob = null
}
