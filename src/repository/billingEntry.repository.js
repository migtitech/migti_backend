import BillingEntryModel from '../models/billingEntry.model.js'

export const countBillingEntries = (filter) =>
  BillingEntryModel.countDocuments(filter)

export const aggregateBillingEntryAmount = (match) =>
  BillingEntryModel.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ])

export const findBillingEntriesForBranchAnalytics = (filter, skip, limit) =>
  BillingEntryModel.find(filter)
    .select(
      'billingNumber amount entryDate remark companyId salespersonId createdAt'
    )
    .populate('companyId', 'name')
    .populate('salespersonId', 'name')
    .sort({ entryDate: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()

export const findRecentBillingEntriesBySalesperson = (filter, take) =>
  BillingEntryModel.find(filter)
    .sort({ entryDate: -1, createdAt: -1 })
    .limit(take)
    .populate('companyId', 'name')
    .lean()

const billingEntryRepository = {
  find: (filter) => BillingEntryModel.find(filter),
  create: (data) => BillingEntryModel.create(data),
  countDocuments: (filter) => BillingEntryModel.countDocuments(filter),
  aggregate: (pipeline) => BillingEntryModel.aggregate(pipeline),
}

export default billingEntryRepository
