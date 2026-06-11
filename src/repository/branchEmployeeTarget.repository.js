import BranchEmployeeTargetModel from '../models/branchEmployeeTarget.model.js'

export const findBranchEmployeeTargets = (filter) =>
  BranchEmployeeTargetModel.find(filter)
    .populate('branchId', 'name branchcode')
    .populate('zoneId', 'name city')
    .populate('employeeId', 'name email')
    .sort({ dateFrom: -1 })
    .lean()

export const findOneBranchEmployeeTarget = (filter) =>
  BranchEmployeeTargetModel.findOne(filter)

export const findOneBranchEmployeeTargetForSummary = (filter) =>
  BranchEmployeeTargetModel.findOne(filter).sort({ createdAt: -1 }).lean()

export const createBranchEmployeeTarget = (data) =>
  BranchEmployeeTargetModel.create(data)

export const findExpiredBranchEmployeeTargets = (now) =>
  BranchEmployeeTargetModel.find({
    isDeleted: false,
    dateTo: { $lt: now },
  }).lean()

export const softDeleteBranchEmployeeTargetById = (id) =>
  BranchEmployeeTargetModel.updateOne(
    { _id: id },
    { $set: { isDeleted: true } }
  )
