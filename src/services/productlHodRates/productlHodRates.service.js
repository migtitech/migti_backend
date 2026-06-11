import { resetApprovedProductlHodRatesToPending as resetApprovedProductlHodRatesToPendingRepo } from '../../repository/productlHodRates.repository.js'

/** Reset all approved HOD rates to pending (daily cron). */
export const resetApprovedProductlHodRatesToPending = async () => {
  const result = await resetApprovedProductlHodRatesToPendingRepo()

  return {
    matchedCount: result.matchedCount ?? 0,
    modifiedCount: result.modifiedCount ?? 0,
  }
}
