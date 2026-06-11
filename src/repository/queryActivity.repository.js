import QueryActivityModel from '../models/queryActivity.model.js'

export const countQueryActivities = (filter) =>
  QueryActivityModel.countDocuments(filter)

export const findQueryActivitiesPaginated = (filter, skip, limit) =>
  QueryActivityModel.find(filter)
    .select('queryId type performedBy meta createdAt')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()

export const createQueryActivity = (data) => QueryActivityModel.create(data)

export const findQueryActivityByIdPopulated = (activityId) =>
  QueryActivityModel.findById(activityId)
    .populate('performedBy', 'name email')
    .lean()
