import IndustryPurchaseManagerModel from '../models/industryPurchaseManager.model.js'

export const insertIndustryPurchaseManagers = (docs) =>
  IndustryPurchaseManagerModel.insertMany(docs)

export const findIndustryPurchaseManagersByIndustryId = (industryId) =>
  IndustryPurchaseManagerModel.find({
    industryId,
    isDeleted: false,
  }).lean()

export const findIndustryPurchaseManagersByIndustryIds = (industryIds) =>
  IndustryPurchaseManagerModel.find({
    industryId: { $in: industryIds },
    isDeleted: false,
  }).lean()

export const softDeleteIndustryPurchaseManagersByIndustryId = (industryId) =>
  IndustryPurchaseManagerModel.updateMany(
    { industryId, isDeleted: false },
    { $set: { isDeleted: true } }
  )

export const softDeleteAllIndustryPurchaseManagersByIndustryId = (industryId) =>
  IndustryPurchaseManagerModel.updateMany(
    { industryId },
    { $set: { isDeleted: true } }
  )
