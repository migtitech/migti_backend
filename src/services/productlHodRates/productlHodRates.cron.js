import cron from 'node-cron'
import logger from '../../core/config/logger.js'
import { resetApprovedProductlHodRatesToPending } from './productlHodRates.service.js'

let productlHodRatesCronJob = null

export const startProductlHodRatesCron = () => {
  if (productlHodRatesCronJob) return

  productlHodRatesCronJob = cron.schedule(
    '0 0 * * *',
    async () => {
      try {
        const { matchedCount, modifiedCount } =
          await resetApprovedProductlHodRatesToPending()
        logger.info(
          `Productl HOD rates reset cron completed. Matched: ${matchedCount}, modified: ${modifiedCount}`
        )
      } catch (error) {
        logger.error('Productl HOD rates reset cron failed', error)
      }
    },
    { timezone: 'Asia/Kolkata' }
  )

  logger.info('Productl HOD rates reset cron initialized (daily at 12:00 AM IST)')
}

export const stopProductlHodRatesCron = async () => {
  if (!productlHodRatesCronJob) return
  productlHodRatesCronJob.stop()
  productlHodRatesCronJob = null
}
