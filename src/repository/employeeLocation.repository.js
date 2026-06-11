import EmployeeLocationModel from '../models/employeeLocation.model.js'

export const createEmployeeLocation = (doc) => EmployeeLocationModel.create(doc)

export const countEmployeeLocations = (filter) =>
  EmployeeLocationModel.countDocuments(filter)

export const findEmployeeLocations = (filter, skip, limit) =>
  EmployeeLocationModel.find(filter)
    .populate('employeeId', 'name email role')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()

export const aggregateEmployeeLocations = (pipeline) =>
  EmployeeLocationModel.aggregate(pipeline)

export const findLatestEmployeeLocation = (filter) =>
  EmployeeLocationModel.findOne(filter).sort({ createdAt: -1 }).lean()
