import RawQueryModel from '../models/rawQuery.model.js'

export const rawQueryNumberExists = (rawQueryNumber) =>
  RawQueryModel.exists({ raw_query_number: rawQueryNumber })

export const createRawQuery = (doc) => RawQueryModel.create(doc)

export const countRawQueries = (filter) => RawQueryModel.countDocuments(filter)

export const findRawQueries = (filter, skip, limit) =>
  RawQueryModel.find(filter)
    .populate('industry_id', 'name location email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()

export const findRawQueryByIdLean = (filter) =>
  RawQueryModel.findOne(filter).lean()

export const findRawQueryById = (filter) =>
  RawQueryModel.findOne(filter)
    .populate('supplier_id')
    .populate(
      'industry_id',
      'name location address email purchase_manager_name purchase_manager_phone'
    )
    .populate('created_by', 'name email')
    .lean()

export const updateRawQueryById = (rawQueryId, updateData, options) =>
  RawQueryModel.findByIdAndUpdate(rawQueryId, updateData, options).lean()

export const deleteRawQueryById = (rawQueryId) =>
  RawQueryModel.findByIdAndDelete(rawQueryId)
