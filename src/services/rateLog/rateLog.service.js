import {
  findRateLogs,
  insertManyRateLogs,
  aggregateRateLogs,
  distinctRateLogIndustryNames,
} from '../../repository/rateLog.repository.js'
import { findIndustryByIdSelectName } from '../../repository/industry.repository.js'

const normalizeVariants = (variants = []) =>
  (Array.isArray(variants) ? variants : [])
    .map((v) => (typeof v === 'object' ? v?.variantName : v))
    .map((v) => String(v || '').trim())
    .filter(Boolean)

const extractProductId = (p) => {
  if (!p?.product_id) return null
  const pid = p.product_id
  return String(typeof pid === 'object' && pid?._id ? pid._id : pid)
}

const multisetRatesSignature = (products) => {
  const tokens = (products || []).map((p) => {
    if (p?.notAvailable) return 'na'
    const r = p?.rate
    const rNum = r == null || r === '' ? null : Number(r)
    if (rNum == null || Number.isNaN(rNum) || rNum < 0) return 'inv'
    const id = extractProductId(p) ?? 'noid'
    return `${id}\t${rNum}`
  })
  tokens.sort()
  return tokens.join('|')
}

const findPrevProduct = (previousProducts, nextProduct, index) => {
  const prevArr = Array.isArray(previousProducts) ? previousProducts : []
  const atIdx = prevArr[index]
  const nextId = extractProductId(nextProduct)
  if (nextId) {
    if (extractProductId(atIdx) === nextId) return atIdx || {}
    const byId = prevArr.find((p) => extractProductId(p) === nextId)
    return byId || {}
  }
  return atIdx || {}
}

const rateLogFingerprint = (doc) => {
  const qid = doc.quotationId != null ? String(doc.quotationId) : ''
  const variants = Array.isArray(doc.variants) ? doc.variants : []
  return [
    qid,
    String(doc.product_title ?? '').trim(),
    String(doc.description ?? ''),
    variants.join('\u0001'),
    Number(doc.amount),
    String(doc.unit ?? '').trim(),
    String(doc.industry_name ?? '').trim(),
  ].join('\u0002')
}

const buildExactMatchFilter = (doc) => ({
  quotationId: doc.quotationId ?? null,
  product_title: String(doc.product_title ?? '').trim(),
  description: doc.description ?? '',
  variants: Array.isArray(doc.variants) ? doc.variants : [],
  amount: Number(doc.amount),
  unit: String(doc.unit ?? '').trim(),
  industry_name: String(doc.industry_name ?? '').trim(),
  isDeleted: false,
})

const resolveIndustryName = async ({ industry_id, fallbackName = '' }) => {
  if (fallbackName && String(fallbackName).trim())
    return String(fallbackName).trim()
  if (!industry_id) return ''
  const industry = await findIndustryByIdSelectName(industry_id)
  return industry?.name || ''
}

const escapeRegex = (text = '') =>
  String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export const captureRateLogsForProductChanges = async ({
  previousProducts = [],
  updatedProducts = [],
  quotationId = null,
  industry_id = null,
  industry_name = '',
  created_by = null,
  branchId = null,
}) => {
  if (!Array.isArray(updatedProducts) || updatedProducts.length === 0) return

  // No rate-relevant change at all (same rates / notAvailable pattern, order-independent).
  if (
    multisetRatesSignature(previousProducts) ===
    multisetRatesSignature(updatedProducts)
  )
    return

  const resolvedIndustryName = await resolveIndustryName({
    industry_id,
    fallbackName: industry_name,
  })
  const docsToCreate = []

  updatedProducts.forEach((nextProduct, index) => {
    if (nextProduct?.notAvailable) return
    const nextRate = Number(nextProduct?.rate)
    if (Number.isNaN(nextRate) || nextRate < 0) return

    const prevProduct = findPrevProduct(previousProducts, nextProduct, index)
    const prevRate = prevProduct?.rate
    const prevRateNum =
      prevRate == null || prevRate === '' ? null : Number(prevRate)

    // Capture only new/changed rate entries.
    if (
      prevRateNum != null &&
      !Number.isNaN(prevRateNum) &&
      prevRateNum === nextRate
    )
      return

    docsToCreate.push({
      quotationId: quotationId || null,
      product_title: nextProduct?.productName || '',
      description: nextProduct?.description || '',
      variants: normalizeVariants(nextProduct?.variants || []),
      amount: nextRate,
      unit: nextProduct?.unit || '',
      industry_name: resolvedIndustryName,
      created_by: created_by || null,
      branchId: branchId || null,
    })
  })

  if (!docsToCreate.length) return

  const seen = new Set()
  const uniqueDocs = []
  for (const doc of docsToCreate) {
    const fp = rateLogFingerprint(doc)
    if (seen.has(fp)) continue
    seen.add(fp)
    uniqueDocs.push(doc)
  }
  if (!uniqueDocs.length) return

  const existing = await findRateLogs(
    {
      $or: uniqueDocs.map((doc) => buildExactMatchFilter(doc)),
    },
    'quotationId product_title description variants amount unit industry_name'
  )

  const existingFp = new Set(existing.map(rateLogFingerprint))
  const novel = uniqueDocs.filter(
    (doc) => !existingFp.has(rateLogFingerprint(doc))
  )
  if (!novel.length) return

  await insertManyRateLogs(novel, { ordered: false })
}

export const listRateLogs = async ({
  pageNumber = 1,
  pageSize = 20,
  search = '',
  industryName = '',
  branchFilter = {},
}) => {
  const page = Math.max(1, parseInt(pageNumber, 10) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 20))
  const skip = (page - 1) * limit

  const filter = { isDeleted: false, ...branchFilter }

  if (industryName && industryName.trim()) {
    filter.industry_name = { $regex: `^${industryName.trim()}$`, $options: 'i' }
  }

  const pipeline = [
    { $match: filter },
    {
      $addFields: {
        variants_text: {
          $trim: {
            input: {
              $reduce: {
                input: { $ifNull: ['$variants', []] },
                initialValue: '',
                in: { $concat: ['$$value', ' ', { $ifNull: ['$$this', ''] }] },
              },
            },
          },
        },
        product_title_text: { $toLower: { $ifNull: ['$product_title', ''] } },
        description_text: { $toLower: { $ifNull: ['$description', ''] } },
      },
    },
    {
      $addFields: {
        searchable_text: {
          $toLower: {
            $concat: [
              { $ifNull: ['$product_title', ''] },
              ' ',
              { $ifNull: ['$description', ''] },
              ' ',
              { $ifNull: ['$variants_text', ''] },
            ],
          },
        },
        amount_text: { $toString: '$amount' },
      },
    },
    {
      $addFields: {
        searchable_compact: {
          $replaceAll: {
            input: {
              $replaceAll: {
                input: {
                  $replaceAll: {
                    input: '$searchable_text',
                    find: ' ',
                    replacement: '',
                  },
                },
                find: '-',
                replacement: '',
              },
            },
            find: '_',
            replacement: '',
          },
        },
        product_title_compact: {
          $replaceAll: {
            input: {
              $replaceAll: {
                input: {
                  $replaceAll: {
                    input: '$product_title_text',
                    find: ' ',
                    replacement: '',
                  },
                },
                find: '-',
                replacement: '',
              },
            },
            find: '_',
            replacement: '',
          },
        },
        description_compact: {
          $replaceAll: {
            input: {
              $replaceAll: {
                input: {
                  $replaceAll: {
                    input: '$description_text',
                    find: ' ',
                    replacement: '',
                  },
                },
                find: '-',
                replacement: '',
              },
            },
            find: '_',
            replacement: '',
          },
        },
      },
    },
  ]

  if (search && search.trim()) {
    const rawSearch = search.trim().toLowerCase()
    const tokens = rawSearch.split(/\s+/).filter(Boolean)
    const tokenPattern = tokens.map(escapeRegex).join('.*')
    const compactSearch = rawSearch.replace(/[\s\-_]+/g, '')
    const compactPattern = compactSearch
      ? compactSearch.split('').map(escapeRegex).join('.*')
      : ''
    const numericSearch = Number(rawSearch)

    const orSearch = [
      { searchable_text: { $regex: tokenPattern, $options: 'i' } },
      { searchable_compact: { $regex: tokenPattern, $options: 'i' } },
      { product_title_text: { $regex: tokenPattern, $options: 'i' } },
      { description_text: { $regex: tokenPattern, $options: 'i' } },
      { product_title_compact: { $regex: tokenPattern, $options: 'i' } },
      { description_compact: { $regex: tokenPattern, $options: 'i' } },
    ]

    if (compactPattern) {
      orSearch.push({
        searchable_compact: { $regex: compactPattern, $options: 'i' },
      })
      orSearch.push({
        product_title_compact: { $regex: compactPattern, $options: 'i' },
      })
      orSearch.push({
        description_compact: { $regex: compactPattern, $options: 'i' },
      })
    }
    orSearch.push({
      amount_text: { $regex: escapeRegex(rawSearch), $options: 'i' },
    })

    if (!Number.isNaN(numericSearch)) {
      orSearch.push({ amount: numericSearch })
    }

    pipeline.push({ $match: { $or: orSearch } })
  }

  const [items, totalCountRows, industries] = await Promise.all([
    aggregateRateLogs([
      ...pipeline,
      { $sort: { created_at: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          variants_text: 0,
          searchable_text: 0,
          searchable_compact: 0,
          amount_text: 0,
          product_title_text: 0,
          description_text: 0,
          product_title_compact: 0,
          description_compact: 0,
        },
      },
    ]),
    aggregateRateLogs([...pipeline, { $count: 'total' }]),
    distinctRateLogIndustryNames({
      isDeleted: false,
      ...branchFilter,
    }),
  ])

  const totalItems = totalCountRows?.[0]?.total || 0

  const totalPages = Math.ceil(totalItems / limit)
  return {
    items,
    filters: {
      industries: (industries || [])
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b)),
    },
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
