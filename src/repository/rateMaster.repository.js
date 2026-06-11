import RateMasterModel from '../models/rateMaster.model.js'

export const findOneAndUpdateRateMaster = (filter, updateData) =>
  RateMasterModel.findOneAndUpdate(filter, updateData, {
    upsert: true,
    new: true,
    setDefaultsOnInsert: true,
  })

export const findRateMastersWithPopulate = (filter, { skip, limit }) =>
  RateMasterModel.find(filter)
    .populate('branchId', 'name branchName')
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()

export const countRateMasters = (filter) => RateMasterModel.countDocuments(filter)

export const aggregateRateMasters = (pipeline) =>
  RateMasterModel.aggregate(pipeline)
