import TaskManagementModel from '../models/taskManagement.model.js'

export const createTask = (doc) => TaskManagementModel.create(doc)

export const insertTasks = (docs) => TaskManagementModel.insertMany(docs)

export const countTasks = (filter) => TaskManagementModel.countDocuments(filter)

export const findTasks = (filter, skip, limit) =>
  TaskManagementModel.find(filter)
    .populate('employeeId', 'name email designation')
    .populate('branchId', 'name address')
    .populate('productInfo.image', 'path')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()

export const findTaskByIdLean = (filter) =>
  TaskManagementModel.findOne(filter)
    .populate('employeeId', 'name email designation phone')
    .populate('branchId', 'name address')
    .populate('productInfo.image', 'path')
    .lean()

export const findTaskById = (filter) => TaskManagementModel.findOne(filter)

export const findTaskByIdWithPopulates = (taskId) =>
  TaskManagementModel.findById(taskId)
    .populate('employeeId', 'name email designation')
    .populate('branchId', 'name address')
    .populate('productInfo.image', 'path')
    .lean()

export const findTaskByIdWithPopulatesAndPhone = (taskId) =>
  TaskManagementModel.findById(taskId)
    .populate('employeeId', 'name email designation phone')
    .populate('branchId', 'name address')
    .populate('productInfo.image', 'path')
    .lean()
