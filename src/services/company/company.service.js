import CompanyModel from '../../models/company.model.js'
import CustomError from '../../utils/exception.js'
import { statusCodes, errorCodes } from '../../core/common/constant.js'
import { encrypt } from '../../core/crypto/helper.cryto.js'

const DEFAULT_LOGO_URL = 'https://migti.co.in/assets/images/logo.png'

export const addCompany = async ({
  name,
  logoUrl,
  email,
  password,
  brandName,
}) => {
  const existingCompany = await CompanyModel.findOne({ email }).lean()
  if (existingCompany) {
    throw new CustomError(
      statusCodes.conflict,
      'Company already exists',
      errorCodes.already_exist
    )
  }

  const companyDoc = await CompanyModel.create({
    name,
    logoUrl: logoUrl || DEFAULT_LOGO_URL,
    email,
    password: encrypt(password),
    brandName,
  })

  const company = companyDoc.toObject()
  delete company.password
  return company
}

export const listCompanies = async ({
  pageNumber = 1,
  pageSize = 10,
  search = '',
}) => {
  const page = Math.max(1, parseInt(pageNumber))
  const limit = Math.min(100, Math.max(1, parseInt(pageSize)))
  const skip = (page - 1) * limit

  const filter = {}
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { brandName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ]
  }

  const totalItems = await CompanyModel.countDocuments(filter)

  const companies = await CompanyModel.find(filter)
    .select('-password')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()

  const totalPages = Math.ceil(totalItems / limit)
  const hasNextPage = page < totalPages
  const hasPrevPage = page > 1

  return {
    companies,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems,
      itemsPerPage: limit,
      hasNextPage,
      hasPrevPage,
    },
  }
}

export const getCompanyById = async ({ companyId }) => {
  const company = await CompanyModel.findById(companyId)
    .select('-password')
    .lean()

  if (!company) {
    throw new CustomError(
      statusCodes.notFound,
      'Company not found',
      errorCodes.not_found
    )
  }

  return company
}

export const updateCompany = async ({ companyId, ...updateData }) => {
  const company = await CompanyModel.findById(companyId).lean()
  if (!company) {
    throw new CustomError(
      statusCodes.notFound,
      'Company not found',
      errorCodes.not_found
    )
  }

  if (updateData.password) {
    updateData.password = encrypt(updateData.password)
  }

  if (updateData.logoUrl === '') {
    updateData.logoUrl = DEFAULT_LOGO_URL
  }

  const updatedCompany = await CompanyModel.findByIdAndUpdate(
    companyId,
    updateData,
    {
      new: true,
      runValidators: true,
    }
  )
    .select('-password')
    .lean()

  return updatedCompany
}

export const deleteCompany = async ({ companyId }) => {
  const company = await CompanyModel.findById(companyId).lean()
  if (!company) {
    throw new CustomError(
      statusCodes.notFound,
      'Company not found',
      errorCodes.not_found
    )
  }

  await CompanyModel.findByIdAndDelete(companyId)

  return {
    deletedCompany: {
      id: company._id,
      name: company.name,
      email: company.email,
      deletedAt: new Date().toISOString(),
    },
  }
}
