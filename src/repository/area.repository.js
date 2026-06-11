import AreaModel from '../models/area.model.js'

export const findOneAreaLean = (filter) => AreaModel.findOne(filter).lean()

export const findAreasSelectFields = (filter) =>
  AreaModel.find(filter).select('_id name branchId companyId areaType').lean()

export const createArea = (data) => AreaModel.create(data)

export const countAreas = (filter) => AreaModel.countDocuments(filter)

export const findAreasWithPopulate = (filter, { skip, limit }) =>
  AreaModel.find(filter)
    .populate('companyId', 'name')
    .populate('branchId', 'name branchCode')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()

export const findAreaByIdWithDetailPopulate = (filter) =>
  AreaModel.findOne(filter)
    .populate('companyId', 'name')
    .populate('branchId', 'name branchCode')
    .lean()

export const findAreaByIdAndUpdateWithPopulate = (areaId, updateData) =>
  AreaModel.findByIdAndUpdate(areaId, updateData, {
    new: true,
    runValidators: true,
  })
    .populate('companyId', 'name')
    .populate('branchId', 'name branchCode')
    .lean()

export const deleteAreaById = (areaId) => AreaModel.findByIdAndDelete(areaId)

export const findIndustryZoneByBranch = (zoneId, branchId) =>
  AreaModel.findOne({
    _id: zoneId,
    branchId,
    isDeleted: false,
    areaType: 'industry',
  }).lean()
