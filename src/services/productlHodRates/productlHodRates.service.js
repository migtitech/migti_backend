import ProductlHodRatesModel, {
  PRODUCTL_HOD_RATE_STATUS,
} from '../../models/productlHodRates.model.js'

/** Reset all approved HOD rates to pending (daily cron). */
export const resetApprovedProductlHodRatesToPending = async () => {
  const result = await ProductlHodRatesModel.updateMany(
    {
      status: PRODUCTL_HOD_RATE_STATUS.HOD_APPROVED,
      isDeleted: false,
    },
    {
      $set: { status: PRODUCTL_HOD_RATE_STATUS.HOD_APPROVAL_PENDING },
    }
  )

  return {
    matchedCount: result.matchedCount ?? 0,
    modifiedCount: result.modifiedCount ?? 0,
  }
}
