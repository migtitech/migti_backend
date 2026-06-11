import RawQueryActivityModel from '../models/rawQueryActivity.model.js'

export const countRawQueryActivities = (filter) =>
  RawQueryActivityModel.countDocuments(filter)

export const findRawQueryActivities = (filter, skip, limit) =>
  RawQueryActivityModel.find(filter)
    .select('rawQueryId type performedBy meta createdAt')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()

export const createRawQueryActivity = (doc) =>
  RawQueryActivityModel.create(doc)

export const findRawQueryActivityById = (activityId) =>
  RawQueryActivityModel.findById(activityId)
    .populate('performedBy', 'name email')
    .lean()
