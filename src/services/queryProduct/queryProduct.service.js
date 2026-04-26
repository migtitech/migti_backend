import mongoose from 'mongoose'
import QueryProductModel, {
  deriveProBucketStatus,
} from '../../models/queryProduct.model.js'

const OBJECT_ID_REGEX = /^[a-fA-F0-9]{24}$/

const toOid = (v) => {
  if (v == null || v === '') return null
  if (!OBJECT_ID_REGEX.test(String(v))) return null
  return new mongoose.Types.ObjectId(String(v))
}

const cleanImages = (images) => {
  if (!Array.isArray(images)) return []
  return images
    .map((img) => toOid(typeof img === 'object' && img?._id ? img._id : img))
    .filter(Boolean)
}

const cleanVariants = (variants) => {
  if (!Array.isArray(variants)) return []
  return variants
    .map((v) => ({
      variantName: (v && String(v.variantName).trim()) || '',
    }))
    .filter((v) => v.variantName)
}

/**
 * Replace all `query_products` for a query with a fresh snapshot of `query.products[]`.
 * Uses deleteMany + insertMany (only non-deleted rows; soft-deleted parents clear via softDeleteQueryProductRowsForQuery).
 */
export const replaceQueryProductDocuments = async ({
  queryId,
  queryCode = '',
  products = [],
}) => {
  if (!queryId) return

  const qid = toOid(queryId)
  if (!qid) return

  const code = String(queryCode || '').trim()

  const existingRows = await QueryProductModel.find({
    queryId: qid,
    isDeleted: false,
  })
    .select('lineIndex rates')
    .lean()
  const ratesByLineIndex = new Map(
    existingRows.map((d) => [d.lineIndex, Array.isArray(d.rates) ? d.rates : []])
  )

  await QueryProductModel.deleteMany({ queryId: qid })

  if (!Array.isArray(products) || !products.length) {
    return
  }

  const rows = products.map((p, lineIndex) => {
    const prevRates = ratesByLineIndex.get(lineIndex) || []
    return {
      queryId: qid,
      queryCode: code,
      lineIndex,
      productName: String(p.productName || '').trim(),
      quantity: Number(p.quantity) ?? 0,
      unit: (p.unit && String(p.unit).trim()) || '',
      hsnNumber: (p.hsnNumber && String(p.hsnNumber).trim()) || '',
      modelNumber: (p.modelNumber && String(p.modelNumber).trim()) || '',
      gstPercentage:
        typeof p.gstPercentage === 'number' ? p.gstPercentage : null,
      variants: cleanVariants(p.variants),
      remark: (p.remark && String(p.remark)) || '',
      description: (p.description && String(p.description)) || '',
      product_id: toOid(p.product_id),
      groupId: toOid(p.groupId),
      categoryId: toOid(p.categoryId),
      rawProductCode: (p.rawProductCode && String(p.rawProductCode).trim()) || '',
      query_tracking_code:
        (p.query_tracking_code && String(p.query_tracking_code).trim()) || '',
      images: cleanImages(p.images),
      rates: prevRates,
      status: deriveProBucketStatus(prevRates.length),
    }
  })

  await QueryProductModel.insertMany(rows, { ordered: true })
}

export const softDeleteQueryProductRowsForQuery = async (queryId) => {
  const qid = toOid(queryId)
  if (!qid) return
  await QueryProductModel.updateMany(
    { queryId: qid, isDeleted: false },
    { $set: { isDeleted: true } }
  )
}

/**
 * @param {import('mongoose').ObjectId} queryId
 */
export const listQueryProductDocuments = async (queryId) => {
  const qid = toOid(queryId)
  if (!qid) return []
  return QueryProductModel.find({ queryId: qid, isDeleted: false })
    .sort({ lineIndex: 1 })
    .lean()
}
