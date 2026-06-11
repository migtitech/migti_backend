import { RATE_MASTER_TYPE } from '../../models/rateMaster.model.js'
import {
  findOneAndUpdateRateMaster,
  findRateMastersWithPopulate,
  countRateMasters,
  aggregateRateMasters,
} from '../../repository/rateMaster.repository.js'

const SNAPSHOT_FIELD_BY_TYPE = Object.freeze({
  [RATE_MASTER_TYPE.PROCUREMENT]: 'procurementSnapshot',
  [RATE_MASTER_TYPE.QUOTED]: 'quotationSnapshot',
  [RATE_MASTER_TYPE.PO]: 'poSnapshot',
  [RATE_MASTER_TYPE.BILLING]: 'purchaseSnapshot',
})

const normCode = (v) => String(v ?? '').trim()
const normProductCode = (v) => normCode(v).toUpperCase()

const toNumberOrNull = (v) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

/**
 * Upsert Rate_master rows for one stage + code, one row per product code.
 *
 * Dedup: rows are keyed by (type, sourceCode, productCode). If a row already
 * exists for the same code + product it is UPDATED; otherwise it is created.
 * Errors are swallowed so callers' primary flow is never affected.
 *
 * @param {object} args
 * @param {string} args.type One of RATE_MASTER_TYPE values.
 * @param {string} args.sourceCode Stage code (queryCode/quotationCode/poCode/billingRequestCode).
 * @param {object|null} [args.sourceId] Originating document id.
 * @param {object|null} [args.branchId] Owning branch id.
 * @param {Array<object>} args.items [{ productCode, rate, unit, supplierSnapshot, snapshot }]
 */
export const upsertRateMasterEntries = async ({
  type,
  sourceCode,
  sourceId = null,
  branchId = null,
  items = [],
}) => {
  const snapshotField = SNAPSHOT_FIELD_BY_TYPE[type]
  const code = normCode(sourceCode)

  if (!snapshotField || !code || !Array.isArray(items) || items.length === 0) {
    return { upserted: 0 }
  }

  let upserted = 0
  for (const item of items) {
    try {
      const productCode = normProductCode(item?.productCode)
      if (!productCode) continue

      const set = {
        type,
        sourceCode: code,
        productCode,
        rate: toNumberOrNull(item?.rate),
        unit: item?.unit != null ? String(item.unit).trim() : '',
        supplierSnapshot: item?.supplierSnapshot ?? null,
        [snapshotField]: item?.snapshot ?? null,
      }
      if (sourceId != null) set.sourceId = sourceId
      if (branchId != null) set.branchId = branchId

      await findOneAndUpdateRateMaster(
        { type, sourceCode: code, productCode },
        { $set: set }
      )
      upserted += 1
    } catch (err) {
      console.error(
        '[rateMaster] upsert failed type=%s code=%s product=%s: %s',
        type,
        code,
        item?.productCode,
        err?.message || err
      )
    }
  }

  return { upserted }
}

/**
 * Paginated list of all captured rates for a product code (the large dataset
 * rendered in chunks on the Rate Master UI). Newest first; optional type
 * filter (procurement | quoted | po | billing).
 */
export const listRatesByProductCode = async ({
  productCode,
  type,
  page = 1,
  limit = 25,
}) => {
  const code = normProductCode(productCode)
  const currentPage = Math.max(1, parseInt(page, 10) || 1)
  const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10) || 25))
  const skip = (currentPage - 1) * pageSize

  const filter = { productCode: code, isDeleted: false }
  if (type) filter.type = type

  const [items, total] = await Promise.all([
    findRateMastersWithPopulate(filter, { skip, limit: pageSize }),
    countRateMasters(filter),
  ])

  return {
    items,
    pagination: {
      page: currentPage,
      limit: pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      hasMore: skip + items.length < total,
    },
  }
}

/**
 * Header summary for a product code: total rows, per-type counts and rate
 * statistics (min / max / avg) across all captured rates.
 */
export const getProductCodeSummary = async ({ productCode }) => {
  const code = normProductCode(productCode)

  const rows = await aggregateRateMasters([
    { $match: { productCode: code, isDeleted: { $ne: true } } },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        minRate: { $min: '$rate' },
        maxRate: { $max: '$rate' },
        avgRate: { $avg: '$rate' },
      },
    },
  ])

  const byType = {}
  let total = 0
  let minRate = null
  let maxRate = null
  for (const r of rows) {
    byType[r._id] = {
      count: r.count,
      minRate: r.minRate ?? null,
      maxRate: r.maxRate ?? null,
      avgRate: r.avgRate != null ? Math.round(r.avgRate * 100) / 100 : null,
    }
    total += r.count
    if (r.minRate != null) {
      minRate = minRate == null ? r.minRate : Math.min(minRate, r.minRate)
    }
    if (r.maxRate != null) {
      maxRate = maxRate == null ? r.maxRate : Math.max(maxRate, r.maxRate)
    }
  }

  return { productCode: code, total, minRate, maxRate, byType }
}

/**
 * Typeahead over product codes that actually have captured rates. Returns
 * distinct codes (with a per-code row count) matching the search term.
 */
export const searchProductCodes = async ({ search = '', limit = 10 }) => {
  const take = Math.min(50, Math.max(1, parseInt(limit, 10) || 10))
  const term = normCode(search)

  const match = { isDeleted: { $ne: true } }
  if (term) {
    match.productCode = { $regex: term, $options: 'i' }
  }

  const rows = await aggregateRateMasters([
    { $match: match },
    {
      $group: {
        _id: '$productCode',
        count: { $sum: 1 },
        lastUpdated: { $max: '$updatedAt' },
      },
    },
    { $sort: term ? { _id: 1 } : { lastUpdated: -1 } },
    { $limit: take },
    { $project: { _id: 0, productCode: '$_id', count: 1, lastUpdated: 1 } },
  ])

  return { codes: rows }
}

export { RATE_MASTER_TYPE }
