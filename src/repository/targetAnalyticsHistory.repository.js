import TargetAnalyticsHistoryModel from '../models/targetAnalyticsHistory.model.js'

export const findTargetAnalyticsHistory = (filter) =>
  TargetAnalyticsHistoryModel.find(filter)
    .populate('branchId', 'name branchcode')
    .sort({ archivedAt: -1 })
    .limit(200)
    .lean()

export const findOneTargetAnalyticsHistory = (filter) =>
  TargetAnalyticsHistoryModel.findOne(filter).lean()

export const createTargetAnalyticsHistory = (data) =>
  TargetAnalyticsHistoryModel.create(data)
