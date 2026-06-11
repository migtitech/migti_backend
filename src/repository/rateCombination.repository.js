import RateCombinationModel from '../models/rateCombination.model.js'

export const findOneAndUpdateRateCombination = (filter, updateData) =>
  RateCombinationModel.findOneAndUpdate(filter, updateData, {
    upsert: true,
    new: true,
  })

export const findRateCombinationsLean = (filter) =>
  RateCombinationModel.find(filter).lean()

export const findRateCombinationsWithPopulate = (filter) =>
  RateCombinationModel.find(filter)
    .populate(
      'supplier',
      'name shopname phone_1 phone_2 email address shop_location'
    )
    .sort({ rate: 1 })
    .lean()

export const distinctCombinationUniqueIds = (filter) =>
  RateCombinationModel.find(filter).distinct('combinationUniqueId').lean()

export const findRateCombinationByIdLean = (id) =>
  RateCombinationModel.findById(id).lean()

export const deleteRateCombinationById = (id) =>
  RateCombinationModel.findByIdAndDelete(id)

export const deleteManyRateCombinations = (filter) =>
  RateCombinationModel.deleteMany(filter)
