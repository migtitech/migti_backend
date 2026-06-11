import IndustryBranchModel from '../models/industryBranch.model.js'

export const createIndustryBranch = (data) => IndustryBranchModel.create(data)

export const findIndustryBranchByIdWithPopulate = (id) =>
  IndustryBranchModel.findById(id)
    .populate('industryId', 'name location address gstNumber')
    .lean()

export const countIndustryBranches = (filter) =>
  IndustryBranchModel.countDocuments(filter)

export const findIndustryBranchesWithPopulate = (filter, { skip, limit }) =>
  IndustryBranchModel.find(filter)
    .populate('industryId', 'name location address gstNumber')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()

export const findOneIndustryBranchWithPopulate = (filter) =>
  IndustryBranchModel.findOne(filter)
    .populate('industryId', 'name location address gstNumber')
    .lean()

export const findOneIndustryBranchLean = (filter) =>
  IndustryBranchModel.findOne(filter).lean()

export const findIndustryBranchByIdAndUpdateWithPopulate = (id, updateData) =>
  IndustryBranchModel.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  })
    .populate('industryId', 'name location address gstNumber')
    .lean()

export const softDeleteIndustryBranchById = (id) =>
  IndustryBranchModel.findByIdAndUpdate(
    id,
    { $set: { isDeleted: true } },
    { new: true }
  )

export const softDeleteIndustryBranchesByIndustryId = (industryId) =>
  IndustryBranchModel.updateMany(
    { industryId },
    { $set: { isDeleted: true } }
  )
