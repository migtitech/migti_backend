import RateCardModel from '../../models/rateCard.model.js'
import RateCombinationModel from '../../models/rateCombination.model.js'
import ProductModel from '../../models/product.model.js'
import SupplierModel from '../../models/supplier.model.js'
import CustomError from '../../utils/exception.js'
import { statusCodes, errorCodes } from '../../core/common/constant.js'

export const upsertRate = async ({
  productId,
  supplierId,
  rate,
  notes = '',
  combinationUniqueId,
}) => {
  const product = await ProductModel.findById(productId)
  if (!product) {
    throw new CustomError(statusCodes.notFound, 'Product not found', errorCodes.not_found)
  }

  const supplier = await SupplierModel.findById(supplierId)
  if (!supplier) {
    throw new CustomError(statusCodes.notFound, 'Supplier not found', errorCodes.not_found)
  }

  let rateCardEntry

  if (combinationUniqueId && combinationUniqueId.trim()) {
    // Validate combination exists in product
    const comboExists = product.variantCombinations?.some(
      (c) => (c.uniqueId || c._id?.toString()) === combinationUniqueId.trim(),
    )
    if (!comboExists && product.hasVariants) {
      throw new CustomError(
        statusCodes.badRequest,
        'Invalid combination for this product',
        errorCodes.invalid_input,
      )
    }

    // Upsert rate combination
    await RateCombinationModel.findOneAndUpdate(
      {
        product: productId,
        combinationUniqueId: combinationUniqueId.trim(),
        supplier: supplierId,
        isDeleted: false,
      },
      { rate },
      { upsert: true, new: true },
    )

    // Get all combination rates for this product+supplier
    const allCombos = await RateCombinationModel.find({
      product: productId,
      supplier: supplierId,
      isDeleted: false,
    }).lean()

    // Product rate = minimum of all combination rates
    const productRate =
      allCombos.length > 0 ? Math.min(...allCombos.map((c) => c.rate)) : rate

    // Upsert rate card with min rate
    rateCardEntry = await RateCardModel.findOneAndUpdate(
      { product: productId, supplier: supplierId },
      { rate: productRate, notes },
      { upsert: true, new: true },
    )
      .populate('product', 'name sku price')
      .populate('supplier', 'name shopname phone_1 email')
      .lean()
  } else {
    // Product-level rate (no combination) - existing behavior
    rateCardEntry = await RateCardModel.findOneAndUpdate(
      { product: productId, supplier: supplierId },
      { rate, notes },
      { upsert: true, new: true },
    )
      .populate('product', 'name sku price')
      .populate('supplier', 'name shopname phone_1 email')
      .lean()
  }

  return rateCardEntry
}

export const getSuppliersByProduct = async ({ productId, combinationUniqueId }) => {
  const product = await ProductModel.findById(productId)
    .select('name sku price description hasVariants variantCombinations')
    .lean()
  if (!product) {
    throw new CustomError(statusCodes.notFound, 'Product not found', errorCodes.not_found)
  }

  let rates

  if (combinationUniqueId && combinationUniqueId.trim() && combinationUniqueId !== 'base') {
    // Return suppliers with rates for this specific combination
    const comboRates = await RateCombinationModel.find({
      product: productId,
      combinationUniqueId: combinationUniqueId.trim(),
      isDeleted: false,
    })
      .populate('supplier', 'name shopname phone_1 phone_2 email address shop_location')
      .sort({ rate: 1 })
      .lean()

    rates = comboRates.map((r) => ({
      _id: r._id,
      rate: r.rate,
      supplier: r.supplier,
      combinationUniqueId: r.combinationUniqueId,
    }))
  } else {
    // Product-level: return from rate card
    const cardRates = await RateCardModel.find({ product: productId, isDeleted: false })
      .populate('supplier', 'name shopname phone_1 phone_2 email address shop_location')
      .sort({ rate: 1 })
      .lean()

    rates = cardRates.map((r) => ({
      _id: r._id,
      rate: r.rate,
      supplier: r.supplier,
    }))

    // Get combination IDs that have rates (for Search by Product filter)
    const combosWithRates = await RateCombinationModel.find({
      product: productId,
      isDeleted: false,
    })
      .distinct('combinationUniqueId')
      .lean()

    return { product, rates, combinationIdsWithRates: combosWithRates || [] }
  }

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

export const deleteRateCard = async ({ rateCardId, rateCombinationId }) => {
  if (rateCombinationId) {
    const rateCombo = await RateCombinationModel.findById(rateCombinationId).lean()
    if (!rateCombo) {
      throw new CustomError(
        statusCodes.notFound,
        'Rate combination entry not found',
        errorCodes.not_found,
      )
    }
    await RateCombinationModel.findByIdAndDelete(rateCombinationId)

    const remaining = await RateCombinationModel.find({
      product: rateCombo.product,
      supplier: rateCombo.supplier,
      isDeleted: false,
    }).lean()

    if (remaining.length === 0) {
      await RateCardModel.findOneAndDelete({
        product: rateCombo.product,
        supplier: rateCombo.supplier,
      })
    } else {
      const minRate = Math.min(...remaining.map((r) => r.rate))
      await RateCardModel.findOneAndUpdate(
        { product: rateCombo.product, supplier: rateCombo.supplier },
        { rate: minRate },
      )
    }

    return {
      deletedRateCard: {
        id: rateCombo._id,
        deletedAt: new Date().toISOString(),
      },
    }
  }

  const rateCard = await RateCardModel.findById(rateCardId).lean()
  if (!rateCard) {
    throw new CustomError(statusCodes.notFound, 'Rate card entry not found', errorCodes.not_found)
  }

  await RateCardModel.findByIdAndDelete(rateCardId)
  await RateCombinationModel.deleteMany({
    product: rateCard.product,
    supplier: rateCard.supplier,
  })

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
    .select('name shopname phone_1 email shop_location')
    .sort(search ? { name: 1 } : { createdAt: -1 })
    .limit(take)
    .lean()

  return { suppliers }
}
