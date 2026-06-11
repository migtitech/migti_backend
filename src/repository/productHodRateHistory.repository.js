import ProductHodRateHistoryModel from '../models/productHodRateHistory.model.js'

export const createProductHodRateHistory = (data) =>
  ProductHodRateHistoryModel.create(data)

export const countProductHodRateHistories = (filter) =>
  ProductHodRateHistoryModel.countDocuments(filter)

export const findProductHodRateHistories = (filter, { skip, limit }) =>
  ProductHodRateHistoryModel.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('updatedBy', 'name email')
    .lean()
