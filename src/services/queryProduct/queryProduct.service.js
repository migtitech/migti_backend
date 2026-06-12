import mongoose from 'mongoose'
import QueryProductModel, {
  deriveProBucketStatus,
  PRO_BUCKET_STATUS,
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

/** Match key for carrying Pro Bucket `rates` across sync: same as query line `rawProductCode`. */
const legacyRatesKey = (rawProductCode, lineIndex) => {
  const c = rawProductCode != null ? String(rawProductCode).trim() : ''
  return c || `__line:${lineIndex}`
}

/**
 * Build FIFO queues of prior `rates` per match key so reordered / edited lines keep the right bucket data.
 */
const buildRatesQueuesFromExisting = (existingRows) => {
  const queues = new Map()
  const sorted = [...existingRows].sort(
    (a, b) => (a.lineIndex ?? 0) - (b.lineIndex ?? 0)
  )
  for (const d of sorted) {
    const key = legacyRatesKey(d.rawProductCode, d.lineIndex)
    const rates = Array.isArray(d.rates) ? d.rates : []
    if (!queues.has(key)) queues.set(key, [])
    queues.get(key).push(rates)
  }
  return queues
}

const shiftPriorRates = (queues, rawProductCode, lineIndex) => {
  const key = legacyRatesKey(rawProductCode, lineIndex)
  const q = queues.get(key)
  if (q && q.length) return q.shift()
  const lineOnly = queues.get(`__line:${lineIndex}`)
  if (lineOnly && lineOnly.length) return lineOnly.shift()
  return []
}

/**
 * Replace all `query_products` for a query with a fresh snapshot of `query.products[]`.
 * Prior Pro Bucket `rates` are matched by `rawProductCode` (same as query `products[]`), then by line index for legacy rows.
 * Uses deleteMany + insertMany (soft-deleted parents clear via softDeleteQueryProductRowsForQuery).
 *
 * @param {boolean} [skipRatesCarryOver=false] - Skip loading existing rates when the
 *   query is brand-new and can never have prior query_product rows (avoids a needless DB round-trip).
 */
export const replaceQueryProductDocuments = async ({
  queryId,
  queryCode = '',
  products = [],
  skipRatesCarryOver = false,
}) => {
  if (!queryId) return

  const qid = toOid(queryId)
  if (!qid) return

  const code = String(queryCode || '').trim()

  let ratesQueues = new Map()
  if (!skipRatesCarryOver) {
    const existingRows = await QueryProductModel.find({
      queryId: qid,
      isDeleted: false,
    })
      .select('lineIndex rawProductCode rates')
      .lean()
    ratesQueues = buildRatesQueuesFromExisting(existingRows)
  }

  await QueryProductModel.deleteMany({ queryId: qid })

  if (!Array.isArray(products) || !products.length) {
    return
  }

  const rows = products.map((p, lineIndex) => {
    const rawCode = (p.rawProductCode && String(p.rawProductCode).trim()) || ''

    const prevRates = skipRatesCarryOver
      ? []
      : shiftPriorRates(ratesQueues, rawCode, lineIndex)

    const status = skipRatesCarryOver
      ? PRO_BUCKET_STATUS.APPROVAL_PENDING
      : deriveProBucketStatus(prevRates.length)

    return {
      queryId: qid,
      queryCode: code,
      lineIndex,
      productName: String(p.productName || '').trim(),
      quantity: Number(p.quantity ?? 0),
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
      subcategoryId: toOid(p.subcategoryId),
      rawProductCode: rawCode,
      query_tracking_code:
        (p.query_tracking_code && String(p.query_tracking_code).trim()) || '',
      images: cleanImages(p.images),
      rates: prevRates,
      status,
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
