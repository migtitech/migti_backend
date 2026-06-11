import BranchZoneTargetHistoryModel from '../models/branchZoneTargetHistory.model.js'

export const findBranchZoneTargetHistory = (filter) =>
  BranchZoneTargetHistoryModel.find(filter)
    .populate('branchId', 'name branchcode')
    .populate('zoneId', 'name city')
    .sort({ archivedAt: -1 })
    .limit(200)
    .lean()

export const findOneBranchZoneTargetHistory = (filter) =>
  BranchZoneTargetHistoryModel.findOne(filter).lean()

export const createBranchZoneTargetHistory = (data) =>
  BranchZoneTargetHistoryModel.create(data)
