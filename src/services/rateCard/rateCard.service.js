import RateCardModel from '../../models/rateCard.model.js'
import ProductModel from '../../models/product.model.js'
import SupplierModel from '../../models/supplier.model.js'
import CustomError from '../../utils/exception.js'
import { statusCodes, errorCodes } from '../../core/common/constant.js'

export const upsertRate = async ({ productId, supplierId, rate, notes = '' }) => {
  const product = await ProductModel.findById(productId)
  if (!product) {
    throw new CustomError(statusCodes.notFound, 'Product not found', errorCodes.not_found)
  }

  const supplier = await SupplierModel.findById(supplierId)
  if (!supplier) {
    throw new CustomError(statusCodes.notFound, 'Supplier not found', errorCodes.not_found)
  }

  const entry = await RateCardModel.findOneAndUpdate(
    { product: productId, supplier: supplierId },
    { rate, notes },
    { upsert: true, new: true },
  )
    .populate('product', 'name sku price')
    .populate('supplier', 'name shopname phone_1 email')
    .lean()

  return entry
}

export const getSuppliersByProduct = async ({ productId }) => {
  const product = await ProductModel.findById(productId).select('name sku price description').lean()
  if (!product) {
    throw new CustomError(statusCodes.notFound, 'Product not found', errorCodes.not_found)
  }

  const rates = await RateCardModel.find({ product: productId, isDeleted: false })
    .populate('supplier', 'name shopname phone_1 phone_2 email address')
    .sort({ rate: 1 })
    .lean()

  return { product, rates }
}

export const getProductsBySupplier = async ({ supplierId }) => {
  const supplier = await SupplierModel.findById(supplierId)
    .select('name shopname phone_1 phone_2 email address')
    .lean()
  if (!supplier) {
    throw new CustomError(statusCodes.notFound, 'Supplier not found', errorCodes.not_found)
  }

  const rates = await RateCardModel.find({ supplier: supplierId, isDeleted: false })
    .populate('product', 'name sku price description')
    .sort({ createdAt: -1 })
    .lean()

  return { supplier, rates }
}

export const deleteRateCard = async ({ rateCardId }) => {
  const rateCard = await RateCardModel.findById(rateCardId).lean()
  if (!rateCard) {
    throw new CustomError(statusCodes.notFound, 'Rate card entry not found', errorCodes.not_found)
  }

  await RateCardModel.findByIdAndDelete(rateCardId)

  return {
    deletedRateCard: {
      id: rateCard._id,
      deletedAt: new Date().toISOString(),
    },
  }
}

export const searchProducts = async ({ search = '', limit = 10 }) => {
  const take = Math.min(50, Math.max(1, parseInt(limit)))
  const filter = { isDeleted: false }
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { sku: { $regex: search, $options: 'i' } },
    ]
  }

  const products = await ProductModel.find(filter)
    .select('name sku price')
    .sort(search ? { name: 1 } : { createdAt: -1 })
    .limit(take)
    .lean()

  return { products }
}

export const searchSuppliers = async ({ search = '', limit = 10 }) => {
  const take = Math.min(50, Math.max(1, parseInt(limit)))
  const filter = { isDeleted: false }
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { shopname: { $regex: search, $options: 'i' } },
      { phone_1: { $regex: search, $options: 'i' } },
    ]
  }

  const suppliers = await SupplierModel.find(filter)
    .select('name shopname phone_1 email')
    .sort(search ? { name: 1 } : { createdAt: -1 })
    .limit(take)
    .lean()

  return { suppliers }
}
