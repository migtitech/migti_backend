import cron from 'node-cron'
import logger from '../../core/config/logger.js'
import { archiveExpiredTargets } from './targetAnalytics.service.js'

let targetAnalyticsCronJob = null

export const startTargetAnalyticsCron = () => {
  if (targetAnalyticsCronJob) return

  targetAnalyticsCronJob = cron.schedule(
    '0 1 * * *',
    async () => {
      try {
        const result = await archiveExpiredTargets()
        logger.info(`Target analytics archive cron completed. Processed: ${result.processed}`)
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
