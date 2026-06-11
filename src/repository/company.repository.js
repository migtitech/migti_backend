import CompanyModel from '../models/company.model.js'

export const findCompanyByEmail = async (email) => {
  return CompanyModel.findOne({ email }).lean()
}

export const createCompany = async (data) => {
  return CompanyModel.create(data)
}

export const countCompanies = async (filter) => {
  return CompanyModel.countDocuments(filter)
}

export const findCompanies = async (filter, { skip, limit }) => {
  return CompanyModel.find(filter)
    .select('-password')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()
}

export const findCompanyById = async (companyId) => {
  return CompanyModel.findById(companyId).select('-password').lean()
}

export const findCompanyByIdRaw = async (companyId) => {
  return CompanyModel.findById(companyId).lean()
}

export const updateCompanyById = async (companyId, updateData) => {
  return CompanyModel.findByIdAndUpdate(companyId, updateData, {
    new: true,
    runValidators: true,
  })
    .select('-password')
    .lean()
}

export const deleteCompanyById = async (companyId) => {
  return CompanyModel.findByIdAndDelete(companyId)
}
