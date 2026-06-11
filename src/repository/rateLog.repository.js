import RateLogModel from '../models/rateLog.model.js'

export const findRateLogs = (filter, select) =>
  RateLogModel.find(filter).select(select).lean()

export const insertManyRateLogs = (docs, options) =>
  RateLogModel.insertMany(docs, options)

export const aggregateRateLogs = (pipeline) => RateLogModel.aggregate(pipeline)

export const distinctRateLogIndustryNames = (filter) =>
  RateLogModel.distinct('industry_name', filter)
