import SubZoneModel from '../models/subZone.model.js'

export const countSubZones = (filter) => SubZoneModel.countDocuments(filter)

export const createSubZone = (data) => SubZoneModel.create(data)

export const findSubZones = (filter, { skip, limit }) =>
  SubZoneModel.find(filter)
    .sort({ subZoneCode: 1 })
    .skip(skip)
    .limit(limit)
    .lean()

export const findSubZonesByZoneIds = (zoneIds) =>
  SubZoneModel.find({
    zoneId: { $in: zoneIds },
    isDeleted: false,
  })
    .sort({ subZoneCode: 1 })
    .lean()

export const findOneSubZoneLean = (filter) =>
  SubZoneModel.findOne(filter).lean()

export const findSubZoneByIdAndUpdateLean = (id, updateData) =>
  SubZoneModel.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  }).lean()

export const softDeleteSubZoneById = (id) =>
  SubZoneModel.findByIdAndUpdate(id, {
    $set: { isDeleted: true, isActive: false },
  })
