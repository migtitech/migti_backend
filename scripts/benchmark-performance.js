/**
 * Compare optimized vs legacy code paths on live data.
 * Usage: node scripts/benchmark-performance.js
 */
import 'dotenv/config'
import connectDB from '../src/core/database/connection.js'
import mongoose from 'mongoose'
import QueryModel from '../src/models/query.model.js'
import QuotationModel from '../src/models/quotation.model.js'
import QueryProductModel from '../src/models/queryProduct.model.js'
import ProductModel from '../src/models/product.model.js'
import { mergeQuotationRefsForQueries } from '../src/services/query/query.service.js'
import { signPathsInBatch } from '../src/services/document/document.service.js'
import { exportQueryPdf } from '../src/services/query/queryPdfExport.service.js'
import { exportQuotationPdf } from '../src/services/quotation/quotationPdfExport.service.js'
import { prewarmPdfBrowser } from '../src/core/helpers/pdfBrowser.js'

const QUERY_PRODUCT_RATE_STATUSES = ['rate_submitted', 'fulfilled']

const avg = (values) =>
  values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : 0

const median = (values) => {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

const formatMs = (ms) => `${ms.toFixed(1)} ms`

const timeAsync = async (label, fn, runs = 5) => {
  const samples = []
  for (let i = 0; i < runs; i += 1) {
    const start = performance.now()
    await fn()
    samples.push(performance.now() - start)
  }
  return {
    label,
    runs,
    avg: avg(samples),
    median: median(samples),
    min: Math.min(...samples),
    max: Math.max(...samples),
  }
}

const explainSummary = async (model, filter, sort = { createdAt: -1 }) => {
  const explain = await model
    .find(filter)
    .sort(sort)
    .limit(10)
    .explain('executionStats')
  const stats = explain.executionStats || explain
  return {
    docsExamined: stats.totalDocsExamined ?? stats.nReturned ?? 0,
    keysExamined: stats.totalKeysExamined ?? 0,
    nReturned: stats.nReturned ?? 0,
    executionTimeMs: stats.executionTimeMillis ?? 0,
  }
}

const attachRateCountsLegacy = async (queries = []) => {
  const out = []
  for (const q of queries) {
    const count = await QueryProductModel.countDocuments({
      queryId: q._id,
      isDeleted: { $ne: true },
      status: { $in: QUERY_PRODUCT_RATE_STATUSES },
    })
    out.push({ ...q, queryProductRateAvailableCount: count })
  }
  return out
}

const attachRateCountsOptimized = async (queries = []) => {
  const queryIds = queries.map((q) => q._id).filter(Boolean)
  const grouped = await QueryProductModel.aggregate([
    {
      $match: {
        isDeleted: { $ne: true },
        queryId: { $in: queryIds },
        status: { $in: QUERY_PRODUCT_RATE_STATUSES },
      },
    },
    { $group: { _id: '$queryId', count: { $sum: 1 } } },
  ])
  const byQueryId = new Map(grouped.map((g) => [String(g._id), g.count || 0]))
  return queries.map((q) => ({
    ...q,
    queryProductRateAvailableCount: byQueryId.get(String(q._id)) || 0,
  }))
}

const resolveProductsLegacy = async (products = []) => {
  const out = []
  for (const p of products) {
    const code =
      p?.rawProductCode != null ? String(p.rawProductCode).trim() : ''
    if (code) {
      await ProductModel.findOne({
        productCode: code,
        isDeleted: false,
      })
        .select('_id productCode')
        .lean()
    }
    out.push(p)
  }
  return out
}

const resolveProductsOptimized = async (products = []) => {
  const codes = [
    ...new Set(
      products
        .map((p) =>
          p?.rawProductCode != null ? String(p.rawProductCode).trim() : ''
        )
        .filter(Boolean)
    ),
  ]
  if (!codes.length) return products
  await ProductModel.find({
    productCode: { $in: codes },
    isDeleted: false,
  })
    .select('_id productCode')
    .lean()
  return products
}

const signPathsLegacy = async (paths = []) => {
  const unique = [...new Set(paths.filter(Boolean))]
  for (const p of unique) {
    await signPathsInBatch([p])
  }
}

const printRow = (result) => {
  console.log(
    `  ${result.label.padEnd(42)} avg ${formatMs(result.avg)} | median ${formatMs(result.median)} | min ${formatMs(result.min)} | max ${formatMs(result.max)}`
  )
}

const printImprovement = (before, after) => {
  if (!before.avg || !after.avg) return
  const saved = before.avg - after.avg
  const pct = (saved / before.avg) * 100
  console.log(
    `  => ${saved >= 0 ? 'Faster' : 'Slower'} by ${formatMs(Math.abs(saved))} (${Math.abs(pct).toFixed(1)}%)`
  )
}

const run = async () => {
  await connectDB()

  const listFilter = { isDeleted: false }
  const sampleQueries = await QueryModel.find(listFilter)
    .sort({ createdAt: -1 })
    .limit(10)
    .lean()
  const sampleQueryId = sampleQueries[0]?._id

  const sampleQuotation = await QuotationModel.findOne({
    isDeleted: false,
  })
    .sort({ createdAt: -1 })
    .select('_id')
    .lean()

  const sampleProducts = await QueryModel.findOne({ isDeleted: false })
    .select('products')
    .lean()
  const productLines = (sampleProducts?.products || []).slice(0, 8)

  const imagePaths = []
  const docs = await mongoose.connection.db
    .collection('documents')
    .find({ path: { $regex: '^https://' } })
    .limit(12)
    .project({ path: 1 })
    .toArray()
  for (const doc of docs) {
    if (doc?.path) imagePaths.push(doc.path)
  }

  console.log('\n=== Migti backend performance benchmark ===\n')
  console.log(`Sample queries on page: ${sampleQueries.length}`)
  console.log(`Sample product lines: ${productLines.length}`)
  console.log(`Sample image paths: ${imagePaths.length}`)

  console.log('\n-- MongoDB index usage (list queries page 1) --')
  const explain = await explainSummary(QueryModel, listFilter)
  console.log(
    `  docsExamined=${explain.docsExamined}, keysExamined=${explain.keysExamined}, returned=${explain.nReturned}, executionTime=${explain.executionTimeMs}ms`
  )
  if (explain.docsExamined > explain.nReturned * 3) {
    console.log(
      '  Note: high docsExamined vs returned — run `node scripts/ensure-performance-indexes.js` if not done yet.'
    )
  } else {
    console.log('  Index scan looks healthy for paginated list query.')
  }

  console.log('\n-- Query list enrichment (5 runs each) --')
  const legacyRateCounts = await timeAsync(
    'Legacy: N countDocuments per query',
    () => attachRateCountsLegacy(sampleQueries),
    5
  )
  const optimizedRateCounts = await timeAsync(
    'Optimized: single aggregation',
    () => attachRateCountsOptimized(sampleQueries),
    5
  )
  printRow(legacyRateCounts)
  printRow(optimizedRateCounts)
  printImprovement(legacyRateCounts, optimizedRateCounts)

  console.log('\n-- Quotation ref merge (5 runs each) --')
  const mergeRefs = await timeAsync(
    'Optimized mergeQuotationRefsForQueries',
    () => mergeQuotationRefsForQueries(sampleQueries)
  )
  printRow(mergeRefs)

  if (productLines.length) {
    console.log('\n-- Product code resolution (5 runs each) --')
    const legacyProducts = await timeAsync('Legacy: findOne per line', () =>
      resolveProductsLegacy(productLines)
    )
    const optimizedProducts = await timeAsync(
      'Optimized: single $in query',
      () => resolveProductsOptimized(productLines)
    )
    printRow(legacyProducts)
    printRow(optimizedProducts)
    printImprovement(legacyProducts, optimizedProducts)
  }

  if (imagePaths.length >= 3) {
    console.log('\n-- S3 path signing (5 runs each) --')
    const legacySigning = await timeAsync(
      'Legacy: sign each path separately',
      () => signPathsLegacy(imagePaths.slice(0, 8))
    )
    const optimizedSigning = await timeAsync(
      'Optimized: signPathsInBatch once',
      () => signPathsInBatch(imagePaths.slice(0, 8))
    )
    printRow(legacySigning)
    printRow(optimizedSigning)
    printImprovement(legacySigning, optimizedSigning)
  }

  if (sampleQueryId) {
    console.log('\n-- PDF export (3 runs each, includes browser reuse) --')
    await prewarmPdfBrowser()

    const queryPdfCold = await timeAsync(
      'Query PDF (optimized path)',
      () =>
        exportQueryPdf({
          queryId: sampleQueryId,
          branchFilter: {},
          isFullAccessRole: true,
        }),
      3
    )
    printRow(queryPdfCold)

    if (sampleQuotation?._id) {
      const quotationPdf = await timeAsync(
        'Quotation PDF (optimized path)',
        () =>
          exportQuotationPdf({
            quotationId: sampleQuotation._id,
            branchFilter: {},
            isFullAccessRole: true,
            role: 'admin',
          }),
        3
      )
      printRow(quotationPdf)
    }
  } else {
    console.log('\n-- PDF export skipped: no sample query found --')
  }

  console.log('\nDone.\n')
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
