import TargetAnalyticsModel from '../models/targetAnalytics.model.js'

export const findTargetAnalytics = (filter) =>
  TargetAnalyticsModel.find(filter)
    .populate('branchId', 'name branchcode')
    .sort({ dateFrom: -1 })
    .lean()

export const findOneTargetAnalytics = (filter) =>
  TargetAnalyticsModel.findOne(filter)

export const findOneTargetAnalyticsForSummary = (filter) =>
  TargetAnalyticsModel.findOne(filter).sort({ createdAt: -1 }).lean()

export const createTargetAnalytics = (data) => TargetAnalyticsModel.create(data)

export const findExpiredTargetAnalytics = (now) =>
  TargetAnalyticsModel.find({
    isDeleted: false,
    dateTo: { $lt: now },
  }).lean()

export const softDeleteTargetAnalyticsById = (id) =>
  TargetAnalyticsModel.updateOne({ _id: id }, { $set: { isDeleted: true } })
