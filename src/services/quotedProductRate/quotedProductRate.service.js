import { bulkWriteQuotedProductRates } from '../../repository/quotedProductRate.repository.js'
import { findProductsByIdsSelectProductCode } from '../../repository/product.repository.js'

/**
 * Upsert quoted product rates snapshot for a quotation.
 * Stores one row per product line with productCode (if available), productName, unit and quotedRate.
 *
 * @param {Object} params
 * @param {Object} params.quotation - quotation document (lean) with products[]
 */
export const upsertQuotedRatesForQuotation = async ({ quotation }) => {
  if (
    !quotation?._id ||
    !Array.isArray(quotation.products) ||
    quotation.products.length === 0
  )
    return

  const quotationId = quotation._id
  const queryId = quotation.queryId || null
  const branchId = quotation.branchId || null

  // Preload product codes for all referenced product_ids to minimize DB round-trips
  const productIdSet = new Set()
  quotation.products.forEach((p) => {
    if (p.product_id) productIdSet.add(String(p.product_id))
  })

  const productCodeMap = new Map()
  if (productIdSet.size > 0) {
    const ids = Array.from(productIdSet)
    const products = await findProductsByIdsSelectProductCode(ids)
    products.forEach((prod) => {
      productCodeMap.set(String(prod._id), prod.productCode || '')
    })
  }

  const ops = []

  quotation.products.forEach((p, index) => {
    const rate =
      typeof p.rate === 'number' && !Number.isNaN(p.rate) && p.rate >= 0
        ? p.rate
        : null

    if (rate === null) {
      // Skip lines without a valid rate - user only wants quoted lines
      return
    }

    const productId = p.product_id || null
    const productIdStr = productId ? String(productId) : null
    const productCode = productIdStr
      ? productCodeMap.get(productIdStr) || ''
      : ''

    const filter = {
      quotationId,
      productId: productId || null,
      productName: p.productName || '',
      unit: p.unit || '',
    }

    const update = {
      $set: {
        quotationId,
        queryId,
        branchId,
        productId: productId || null,
        productCode,
        productName: p.productName || '',
        unit: p.unit || '',
        quotedRate: rate,
        quantity:
          typeof p.quantity === 'number' &&
          !Number.isNaN(p.quantity) &&
          p.quantity >= 0
            ? p.quantity
            : 0,
      },
    }

    ops.push({
      updateOne: {
        filter,
        update,
        upsert: true,
      },
    })
  })

  if (ops.length === 0) return

  await bulkWriteQuotedProductRates(ops, { ordered: false })
}
