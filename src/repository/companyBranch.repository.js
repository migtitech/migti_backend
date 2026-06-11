import CompanyBranchModel from '../models/companyBranch.model.js'

export const findCompanyBranchByEmailOrCode = ({ companyId, email, branchcode }) =>
  CompanyBranchModel.findOne({
    companyId,
    $or: [{ email }, { branchcode }],
  }).lean()

export const createCompanyBranch = (data) => CompanyBranchModel.create(data)

export const countCompanyBranches = (filter) =>
  CompanyBranchModel.countDocuments(filter)

export const findCompanyBranches = (filter, { skip, limit }) =>
  CompanyBranchModel.find(filter)
    .populate('signature', 'path')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()

export const findCompanyBranchById = (companyBranchId) =>
  CompanyBranchModel.findById(companyBranchId)
    .populate('signature', 'path')
    .lean()

export const findCompanyBranchByIdRaw = (companyBranchId) =>
  CompanyBranchModel.findById(companyBranchId).lean()

export const updateCompanyBranchById = (companyBranchId, updateData) =>
  CompanyBranchModel.findByIdAndUpdate(companyBranchId, updateData, {
    new: true,
    runValidators: true,
  })
    .populate('signature', 'path')
    .lean()

export const deleteCompanyBranchById = (companyBranchId) =>
  CompanyBranchModel.findByIdAndDelete(companyBranchId)

export const findOneCompanyBranchLean = (filter) =>
  CompanyBranchModel.findOne(filter).lean()

export const findCompanyBranchSignatureById = (id) =>
  CompanyBranchModel.findById(id).select('signature').lean()

const companyBranchRepository = {
  findById: (id) => CompanyBranchModel.findById(id),
}

export default companyBranchRepository
