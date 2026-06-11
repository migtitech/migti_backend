import IndustryModel from '../models/industry.model.js'

export const countIndustries = (filter) => IndustryModel.countDocuments(filter)

export const createIndustry = (data) => IndustryModel.create(data)

export const findActiveIndustryByGstRegex = (regex) =>
  IndustryModel.findOne({
    isDeleted: false,
    gstNumber: regex,
  }).lean()

export const findActiveIndustryByName = (name, branchFilter = {}) =>
  IndustryModel.findOne({
    name,
    isDeleted: false,
    ...branchFilter,
  }).lean()

export const findIndustries = (filter, skip, limit) =>
  IndustryModel.find(filter)
    .populate('area', 'name city areaType')
    .populate('subZoneId', 'name subZoneCode zoneId')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()

export const findIndustryById = (filter) =>
  IndustryModel.findOne(filter)
    .populate('area', 'name city areaType')
    .populate('subZoneId', 'name subZoneCode zoneId')
    .lean()

export const findIndustryByIdLean = (filter) =>
  IndustryModel.findOne(filter).lean()

export const findIndustryByIdWithPopulates = (industryId) =>
  IndustryModel.findById(industryId)
    .populate('area', 'name city areaType')
    .populate('subZoneId', 'name subZoneCode zoneId')
    .lean()

export const softDeleteIndustryById = (industryId) =>
  IndustryModel.findByIdAndUpdate(
    industryId,
    { $set: { isDeleted: true, isActive: false } },
    { new: true }
  )

export const updateIndustryById = (industryId, updateData, options) =>
  IndustryModel.findByIdAndUpdate(industryId, updateData, options)
    .populate('area', 'name city areaType')
    .populate('subZoneId', 'name subZoneCode zoneId')
    .lean()

export const findIndustryIdsByTerritory = (filter) =>
  IndustryModel.find(filter).select('_id').lean()

export const findIndustryByIdSelectName = (id) =>
  IndustryModel.findById(id).select('name').lean()

export const findIndustryIdsByNameSearch = (regex) =>
  IndustryModel.find({ isDeleted: false, name: regex }).select('_id').lean()

export const findOneIndustryLean = (filter) =>
  IndustryModel.findOne(filter).lean()

export const findOneIndustrySelectAreaName = (filter) =>
  IndustryModel.findOne(filter).select('area name').lean()

export const findIndustryAreaById = (industryId) =>
  IndustryModel.findById(industryId).select('area').lean()

export const findIndustriesSelectIdLean = (filter) =>
  IndustryModel.find(filter).select('_id').lean()

const industryRepository = {
  find: (filter) => IndustryModel.find(filter),
  findOne: (filter) => IndustryModel.findOne(filter),
}

export default industryRepository
