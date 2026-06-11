import BranchEmployeeTargetHistoryModel from '../models/branchEmployeeTargetHistory.model.js'

export const findBranchEmployeeTargetHistory = (filter) =>
  BranchEmployeeTargetHistoryModel.find(filter)
    .populate('branchId', 'name branchcode')
    .populate('zoneId', 'name city')
    .populate('employeeId', 'name email')
    .sort({ archivedAt: -1 })
    .limit(200)
    .lean()

export const findOneBranchEmployeeTargetHistory = (filter) =>
  BranchEmployeeTargetHistoryModel.findOne(filter).lean()

export const createBranchEmployeeTargetHistory = (data) =>
  BranchEmployeeTargetHistoryModel.create(data)
