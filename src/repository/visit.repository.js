import VisitModel from '../models/visit.model.js'

export const createVisit = (doc) => VisitModel.create(doc)

export const countVisits = (filter) => VisitModel.countDocuments(filter)

export const findVisits = (filter, skip, limit) =>
  VisitModel.find(filter)
    .populate('branchId', 'name location')
    .populate('zoneId', 'name city areaType')
    .populate('employeeId', 'name role')
    .populate('industryIds', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()

export const findVisitByFilterLean = (filter) =>
  VisitModel.findOne(filter).lean()

export const updateVisitById = (visitId, update, options) =>
  VisitModel.findByIdAndUpdate(visitId, update, options).lean()
