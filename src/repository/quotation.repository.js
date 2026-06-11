import QuotationModel from '../models/quotation.model.js'

export { QUOTATION_STATUS } from '../models/quotation.model.js'

export const findQuotationsByQueryIds = (ids) =>
  QuotationModel.find({
    queryId: { $in: ids },
    isDeleted: false,
  })
    .select('queryId quotationCode')
    .lean()

export const countQuotations = (filter) => QuotationModel.countDocuments(filter)

export const findQuotationsSelectProductsLean = (filter) =>
  QuotationModel.find(filter).select('products').lean()

export const findQuotationsForBranchAnalytics = (filter, skip, limit) =>
  QuotationModel.find(filter)
    .select(
      'quotationCode status companyInfo createdAt branchId totalAmount products'
    )
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()

export const findPendingQuotationsForDashboard = (filter) =>
  QuotationModel.find(filter)
    .sort({ createdAt: -1 })
    .limit(25)
    .select('quotationCode companyInfo status createdAt')
    .lean()

export const clearIndustryIdFromQuotations = (industryId) =>
  QuotationModel.updateMany(
    { industry_id: industryId },
    { $set: { industry_id: null } }
  )

export const findQuotationProductsById = (filter) =>
  QuotationModel.findOne(filter).select('products').lean()

export const findQuotationsProductsForSum = (filter) =>
  QuotationModel.find(filter).select('products').lean()

export const findQuotationsForList = (filter, { skip, limit }) =>
  QuotationModel.find(filter)
    .populate('queryId', 'queryCode status')
    .populate('industry_id', 'name location email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()

export const findQuotationByIdWithDetails = (
  filter,
  { forPdf = false } = {}
) => {
  let quotationQuery = QuotationModel.findOne(filter)
    .populate(
      'queryId',
      'queryCode status companyInfo industry_id products created_by branchId'
    )
    .populate(
      'industry_id',
      'name location address email purchase_manager_name purchase_manager_phone gstNumber'
    )

  if (!forPdf) {
    quotationQuery = quotationQuery.populate('created_by', 'name email')
  }

  return quotationQuery
    .populate({
      path: 'products.product_id',
      select:
        'name shortDescription images hsnNumber gstPercentage unit productCode companyProductCodes',
      populate: { path: 'images', select: 'path', model: 'document' },
    })
    .populate({
      path: 'products.images',
      select: 'path',
      model: 'document',
    })
    .lean()
}

export const findQuotationByIdSelectQueryProducts = (filter) =>
  QuotationModel.findOne(filter).select('queryId products').lean()

export const findQuotationByIdSelectQueryId = (filter) =>
  QuotationModel.findOne(filter).select('queryId').lean()

export const findQuotationByQueryIdWithPopulate = (filter) =>
  QuotationModel.findOne(filter)
    .populate('queryId', 'queryCode status')
    .populate('industry_id', 'name location email')
    .lean()

export const findByIdAndUpdateQuotationWithPopulate = (id, update, options) =>
  QuotationModel.findByIdAndUpdate(id, update, options)
    .populate('queryId', 'queryCode status')
    .populate('industry_id', 'name location email')
    .populate({ path: 'products.images', select: 'path' })
    .lean()

export const findByIdAndUpdateQuotationStatus = (id, update, options) =>
  QuotationModel.findByIdAndUpdate(id, update, options)
    .populate('queryId', 'queryCode status')
    .populate('industry_id', 'name location email')
    .lean()

export const findQuotationsSelectFields = (filter, select) =>
  QuotationModel.find(filter).select(select).lean()

export const quotationExists = (filter) => QuotationModel.exists(filter)

const quotationRepository = {
  find: (filter) => QuotationModel.find(filter),
  findOne: (filter) => QuotationModel.findOne(filter),
  findById: (id) => QuotationModel.findById(id),
  findByIdAndUpdate: (id, update, options) =>
    QuotationModel.findByIdAndUpdate(id, update, options),
  create: (data) => QuotationModel.create(data),
  countDocuments: (filter) => QuotationModel.countDocuments(filter),
}

export default quotationRepository
