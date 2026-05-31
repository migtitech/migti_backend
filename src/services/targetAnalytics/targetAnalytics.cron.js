import cron from 'node-cron'
import logger from '../../core/config/logger.js'
import {
  archiveExpiredTargets,
  archiveExpiredZoneAndEmployeeTargets,
  closeExpiredZoneTargets,
} from './targetAnalytics.service.js'

let targetAnalyticsCronJob = null

export const startTargetAnalyticsCron = () => {
  if (targetAnalyticsCronJob) return

  targetAnalyticsCronJob = cron.schedule(
    '0 0 * * *',
    async () => {
      try {
        const closed = await closeExpiredZoneTargets()
        logger.info(
          `Zone targets closed: ${closed.closed}`
        )
        const result = await archiveExpiredTargets()
        const ext = await archiveExpiredZoneAndEmployeeTargets()
        logger.info(
          `Target analytics archive cron completed. Processed: ${result.processed}, zone: ${ext.zoneProcessed}, employee: ${ext.employeeProcessed}`
        )
      } catch (error) {
        logger.error('Target analytics archive cron failed', error)
      }
    },
    { timezone: 'Asia/Kolkata' }
  )

  logger.info('Target analytics cron initialized')
}

export const stopTargetAnalyticsCron = async () => {
  if (!targetAnalyticsCronJob) return
  targetAnalyticsCronJob.stop()
  targetAnalyticsCronJob = null
}
