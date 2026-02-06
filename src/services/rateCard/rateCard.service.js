import RateCardModel from '../../models/rateCard.model.js'
import CustomError from '../../utils/exception.js'
import { statusCodes, errorCodes } from '../../core/common/constant.js'

const buildRateCardSearchFilter = (search = '', status = '') => {
  const filter = { isDeleted: false }
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ]
  }
  if (status) {
    filter.status = status
  }
  return filter
}

export const addRateCard = async (data) => {
  const rateCard = await RateCardModel.create(data)
  return rateCard.toObject()
}

export const listRateCards = async ({
  pageNumber = 1,
  pageSize = 10,
  search = '',
  status = '',
}) => {
  const page = Math.max(1, parseInt(pageNumber))
  const limit = Math.min(100, Math.max(1, parseInt(pageSize)))
  const skip = (page - 1) * limit

  const filter = buildRateCardSearchFilter(search, status)

  const totalItems = await RateCardModel.countDocuments(filter)

  const rateCards = await RateCardModel.find(filter)
    .populate('applicableCategories', 'name slug')
    .populate('applicableProducts', 'name sku')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()

  const totalPages = Math.ceil(totalItems / limit)

  return {
    rateCards,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  }
}

export const searchRateCards = async ({ search = '', limit = 5 }) => {
  const take = Math.min(20, Math.max(1, parseInt(limit)))
  const filter = buildRateCardSearchFilter(search)
  const sort = search ? { name: 1 } : { createdAt: -1 }

  const rateCards = await RateCardModel.find(filter)
    .select('name description type value status')
    .sort(sort)
    .limit(take)
    .lean()

  return { rateCards }
}

export const getRateCardById = async ({ rateCardId }) => {
  const rateCard = await RateCardModel.findById(rateCardId)
    .populate('applicableCategories', 'name slug')
    .populate('applicableProducts', 'name sku')
    .lean()

  if (!rateCard) {
    throw new CustomError(
      statusCodes.notFound,
      'Rate card not found',
      errorCodes.not_found,
    )
  }

  return rateCard
}

export const updateRateCard = async ({ rateCardId, ...updateData }) => {
  const rateCard = await RateCardModel.findById(rateCardId).lean()
  if (!rateCard) {
    throw new CustomError(
      statusCodes.notFound,
      'Rate card not found',
      errorCodes.not_found,
    )
  }

  const updated = await RateCardModel.findByIdAndUpdate(rateCardId, updateData, {
    new: true,
    runValidators: true,
  })
    .populate('applicableCategories', 'name slug')
    .populate('applicableProducts', 'name sku')
    .lean()

  return updated
}

export const deleteRateCard = async ({ rateCardId }) => {
  const rateCard = await RateCardModel.findById(rateCardId).lean()
  if (!rateCard) {
    throw new CustomError(
      statusCodes.notFound,
      'Rate card not found',
      errorCodes.not_found,
    )
  }

  await RateCardModel.findByIdAndDelete(rateCardId)

  return {
    deletedRateCard: {
      id: rateCard._id,
      name: rateCard.name,
      deletedAt: new Date().toISOString(),
    },
  }
}

export const addSupplierToRateCard = async ({ rateCardId, supplierName, rate, contact, notes = '' }) => {
  const rateCard = await RateCardModel.findById(rateCardId)
  if (!rateCard) {
    throw new CustomError(
      statusCodes.notFound,
      'Rate card not found',
      errorCodes.not_found,
    )
  }
  // Ensure required field for validation (handles legacy docs or docs created without name)
  if (!rateCard.name || (typeof rateCard.name === 'string' && rateCard.name.trim() === '')) {
    rateCard.name = rateCard.description?.trim() || 'Unnamed Product'
  }
  // Validate the document before adding supplier
  const validationError = rateCard.validateSync()
  if (validationError) {
    throw new CustomError(
      statusCodes.badRequest,
      `Rate card is invalid: ${validationError.message}. Please update the rate card first.`,
      errorCodes.validation_error,
    )
  }
  rateCard.suppliers.push({ supplierName, rate, contact, notes })
  try {
    await rateCard.save()
  } catch (error) {
    if (error.name === 'ValidationError') {
      throw new CustomError(
        statusCodes.badRequest,
        `Rate card validation failed: ${error.message}. Please ensure the rate card has a valid name.`,
        errorCodes.validation_error,
      )
    }
    throw error
  }
  const updated = await RateCardModel.findById(rateCardId).lean()
  return updated
}

export const updateSupplierOnRateCard = async ({ rateCardId, supplierId, supplierName, rate, contact, notes }) => {
  const rateCard = await RateCardModel.findById(rateCardId)
  if (!rateCard) {
    throw new CustomError(
      statusCodes.notFound,
      'Rate card not found',
      errorCodes.not_found,
    )
  }
  const supplier = rateCard.suppliers.id(supplierId)
  if (!supplier) {
    throw new CustomError(
      statusCodes.notFound,
      'Supplier not found on this rate card',
      errorCodes.not_found,
    )
  }
  if (supplierName !== undefined) supplier.supplierName = supplierName
  if (rate !== undefined) supplier.rate = rate
  if (contact !== undefined) supplier.contact = contact
  if (notes !== undefined) supplier.notes = notes
  if (!rateCard.name) rateCard.name = rateCard.description || 'Unnamed'
  await rateCard.save()
  const updated = await RateCardModel.findById(rateCardId).lean()
  return updated
}

export const deleteSupplierFromRateCard = async ({ rateCardId, supplierId }) => {
  const rateCard = await RateCardModel.findById(rateCardId)
  if (!rateCard) {
    throw new CustomError(
      statusCodes.notFound,
      'Rate card not found',
      errorCodes.not_found,
    )
  }
  const supplier = rateCard.suppliers.id(supplierId)
  if (!supplier) {
    throw new CustomError(
      statusCodes.notFound,
      'Supplier not found on this rate card',
      errorCodes.not_found,
    )
  }
  rateCard.suppliers.pull(supplierId)
  if (!rateCard.name || rateCard.name.trim() === '') {
    rateCard.name = rateCard.description?.trim() || 'Unnamed Product'
  }
  await rateCard.save()
  const updated = await RateCardModel.findById(rateCardId).lean()
  return updated
}
