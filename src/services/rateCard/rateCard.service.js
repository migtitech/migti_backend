import {
  findOneAndUpdateRateCardWithPopulate,
  findRateCardsWithPopulate,
  findRateCardsBySupplierWithPopulate,
  findRateCardByIdLean,
  deleteRateCardById,
  findOneAndDeleteRateCard,
  findOneAndUpdateRateCard,
} from '../../repository/rateCard.repository.js'
import {
  findOneAndUpdateRateCombination,
  findRateCombinationsLean,
  findRateCombinationsWithPopulate,
  distinctCombinationUniqueIds,
  findRateCombinationByIdLean,
  deleteRateCombinationById,
  deleteManyRateCombinations,
} from '../../repository/rateCombination.repository.js'
import {
  findProductById,
  findProductByIdSelectFields,
  searchProducts as searchProductsRepo,
} from '../../repository/product.repository.js'
import {
  findSupplierById,
  findSupplierByIdSelectFields,
  searchSuppliers as searchSuppliersRepo,
} from '../../repository/supplier.repository.js'
import CustomError from '../../utils/exception.js'
import { statusCodes, errorCodes } from '../../core/common/constant.js'

export const upsertRate = async ({
  productId,
  supplierId,
  rate,
  notes = '',
  includeGst,
  gstPercentage,
  combinationUniqueId,
  nextDueDate,
  branchId,
}) => {
  const product = await findProductById(productId)
  if (!product) {
    throw new CustomError(
      statusCodes.notFound,
      'Product not found',
      errorCodes.not_found
    )
  }

  const supplier = await findSupplierById(supplierId)
  if (!supplier) {
    throw new CustomError(
      statusCodes.notFound,
      'Supplier not found',
      errorCodes.not_found
    )
  }

  let rateCardEntry
  const branchIdForDoc = branchId || null

  if (combinationUniqueId && combinationUniqueId.trim()) {
    // Validate combination exists in product
    const comboExists = product.variantCombinations?.some(
      (c) => (c.uniqueId || c._id?.toString()) === combinationUniqueId.trim()
    )
    if (!comboExists && product.hasVariants) {
      throw new CustomError(
        statusCodes.badRequest,
        'Invalid combination for this product',
        errorCodes.invalid_input
      )
    }

    // Build update payload for combination
    const comboUpdate = { rate }
    if (typeof includeGst === 'boolean') {
      comboUpdate.includeGst = includeGst
    }
    if (typeof gstPercentage === 'number') {
      comboUpdate.gstPercentage = gstPercentage
    }

    // Upsert rate combination
    await findOneAndUpdateRateCombination(
      {
        product: productId,
        combinationUniqueId: combinationUniqueId.trim(),
        supplier: supplierId,
        branchId: branchIdForDoc,
        isDeleted: false,
      },
      comboUpdate
    )

    // Get all combination rates for this product+supplier
    const allCombos = await findRateCombinationsLean({
      product: productId,
      supplier: supplierId,
      branchId: branchIdForDoc,
      isDeleted: false,
    })

    // Product rate = minimum of all combination rates
    const productRate =
      allCombos.length > 0 ? Math.min(...allCombos.map((c) => c.rate)) : rate

    // Pick GST info from the combination that has the minimum rate
    let minComboGst = {}
    if (allCombos.length > 0) {
      const minCombo = allCombos.reduce(
        (acc, c) => (c.rate < acc.rate ? c : acc),
        allCombos[0]
      )
      minComboGst = {
        includeGst: !!minCombo.includeGst,
        gstPercentage:
          typeof minCombo.gstPercentage === 'number'
            ? minCombo.gstPercentage
            : 0,
      }
    }

    // Upsert rate card with min rate
    rateCardEntry = await findOneAndUpdateRateCardWithPopulate(
      { product: productId, supplier: supplierId, branchId: branchIdForDoc },
      {
        rate: productRate,
        notes,
        branchId: branchIdForDoc,
        ...(allCombos.length > 0 ? minComboGst : {}),
        ...(nextDueDate ? { nextDueDate } : {}),
      }
    )
  } else {
    // Product-level rate (no combination) - existing behavior
    rateCardEntry = await findOneAndUpdateRateCardWithPopulate(
      { product: productId, supplier: supplierId, branchId: branchIdForDoc },
      {
        rate,
        notes,
        branchId: branchIdForDoc,
        ...(typeof includeGst === 'boolean' ? { includeGst } : {}),
        ...(typeof gstPercentage === 'number' ? { gstPercentage } : {}),
        ...(nextDueDate ? { nextDueDate } : {}),
      }
    )
  }

  return rateCardEntry
}

export const getSuppliersByProduct = async ({
  productId,
  combinationUniqueId,
  branchFilter = {},
}) => {
  const product = await findProductByIdSelectFields(
    productId,
    'name sku price description hasVariants variantCombinations'
  )
  if (!product) {
    throw new CustomError(
      statusCodes.notFound,
      'Product not found',
      errorCodes.not_found
    )
  }

  let rates

  if (
    combinationUniqueId &&
    combinationUniqueId.trim() &&
    combinationUniqueId !== 'base'
  ) {
    // Return suppliers with rates for this specific combination
    const comboRates = await findRateCombinationsWithPopulate({
      product: productId,
      combinationUniqueId: combinationUniqueId.trim(),
      isDeleted: false,
      ...branchFilter,
    })

    rates = comboRates.map((r) => ({
      _id: r._id,
      rate: r.rate,
      includeGst: !!r.includeGst,
      gstPercentage: typeof r.gstPercentage === 'number' ? r.gstPercentage : 0,
      supplier: r.supplier,
      combinationUniqueId: r.combinationUniqueId,
    }))
  } else {
    // Product-level: return from rate card
    const cardRates = await findRateCardsWithPopulate({
      product: productId,
      isDeleted: false,
      ...branchFilter,
    })

    rates = cardRates.map((r) => ({
      _id: r._id,
      rate: r.rate,
      includeGst: !!r.includeGst,
      gstPercentage: typeof r.gstPercentage === 'number' ? r.gstPercentage : 0,
      nextDueDate: r.nextDueDate,
      supplier: r.supplier,
    }))

    // Get combination IDs that have rates (for Search by Product filter)
    const combosWithRates = await distinctCombinationUniqueIds({
      product: productId,
      isDeleted: false,
      ...branchFilter,
    })

    return { product, rates, combinationIdsWithRates: combosWithRates || [] }
  }

  return { product, rates }
}

export const getProductsBySupplier = async ({
  supplierId,
  branchFilter = {},
}) => {
  const supplier = await findSupplierByIdSelectFields(
    supplierId,
    'name shopname phone_1 phone_2 email address'
  )
  if (!supplier) {
    throw new CustomError(
      statusCodes.notFound,
      'Supplier not found',
      errorCodes.not_found
    )
  }

  const rates = await findRateCardsBySupplierWithPopulate({
    supplier: supplierId,
    isDeleted: false,
    ...branchFilter,
  })

  const mappedRates = rates.map((r) => ({
    _id: r._id,
    rate: r.rate,
    includeGst: !!r.includeGst,
    gstPercentage: typeof r.gstPercentage === 'number' ? r.gstPercentage : 0,
    nextDueDate: r.nextDueDate,
    product: r.product,
  }))

  return { supplier, rates: mappedRates }
}

export const deleteRateCard = async ({ rateCardId, rateCombinationId }) => {
  if (rateCombinationId) {
    const rateCombo = await findRateCombinationByIdLean(rateCombinationId)
    if (!rateCombo) {
      throw new CustomError(
        statusCodes.notFound,
        'Rate combination entry not found',
        errorCodes.not_found
      )
    }
    await deleteRateCombinationById(rateCombinationId)

    const remaining = await findRateCombinationsLean({
      product: rateCombo.product,
      supplier: rateCombo.supplier,
      branchId: rateCombo.branchId || null,
      isDeleted: false,
    })

    if (remaining.length === 0) {
      await findOneAndDeleteRateCard({
        product: rateCombo.product,
        supplier: rateCombo.supplier,
        branchId: rateCombo.branchId || null,
      })
    } else {
      const minRate = Math.min(...remaining.map((r) => r.rate))
      await findOneAndUpdateRateCard(
        {
          product: rateCombo.product,
          supplier: rateCombo.supplier,
          branchId: rateCombo.branchId || null,
        },
        { rate: minRate }
      )
    }

    return {
      deletedRateCard: {
        id: rateCombo._id,
        deletedAt: new Date().toISOString(),
      },
    }
  }

  const rateCard = await findRateCardByIdLean(rateCardId)
  if (!rateCard) {
    throw new CustomError(
      statusCodes.notFound,
      'Rate card entry not found',
      errorCodes.not_found
    )
  }

  await deleteRateCardById(rateCardId)
  await deleteManyRateCombinations({
    product: rateCard.product,
    supplier: rateCard.supplier,
    branchId: rateCard.branchId || null,
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

  const products = await searchProductsRepo(filter, {
    sort: search ? { name: 1 } : { createdAt: -1 },
    limit: take,
  })

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

  const suppliers = await searchSuppliersRepo(filter, {
    sort: search ? { name: 1 } : { createdAt: -1 },
    limit: take,
  })

  return { suppliers }
}
