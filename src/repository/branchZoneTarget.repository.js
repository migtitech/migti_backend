import BranchZoneTargetModel from '../models/branchZoneTarget.model.js'

export const aggregateBranchZoneTargetAmount = (match) =>
  BranchZoneTargetModel.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: '$targetAmount' } } },
  ])

export const findBranchZoneTargets = (filter) =>
  BranchZoneTargetModel.find(filter)
    .populate('branchId', 'name branchcode')
    .populate('zoneId', 'name city')
    .sort({ dateFrom: -1 })
    .lean()

export const findOneBranchZoneTarget = (filter) =>
  BranchZoneTargetModel.findOne(filter)

export const findOneBranchZoneTargetForSummary = (filter) =>
  BranchZoneTargetModel.findOne(filter).sort({ createdAt: -1 }).lean()

export const createBranchZoneTarget = (data) => BranchZoneTargetModel.create(data)

export const closeExpiredBranchZoneTargets = (now) =>
  BranchZoneTargetModel.updateMany(
    { isDeleted: false, status: 'active', dateTo: { $lt: now } },
    { $set: { status: 'closed' } }
  )

export const findMyBranchZoneTargets = (filter) =>
  BranchZoneTargetModel.find(filter)
    .populate('zoneId', 'name city')
    .populate('branchId', 'name branchcode')
    .sort({ dateFrom: -1 })
    .lean()

export const findExpiredBranchZoneTargets = (now) =>
  BranchZoneTargetModel.find({
    isDeleted: false,
    dateTo: { $lt: now },
  }).lean()

export const softDeleteBranchZoneTargetById = (id) =>
  BranchZoneTargetModel.updateOne({ _id: id }, { $set: { isDeleted: true } })
