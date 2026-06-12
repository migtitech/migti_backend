/**
 * Seed categories and subcategories from TSV file (batch mode).
 * Format: Group<TAB>Category<TAB>Subcategory<TAB>Status
 *
 * Run: node scripts/seed-categories.js [dbName]
 */

import fs from 'fs'
import path from 'path'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'

import GroupModel from '../src/models/group.model.js'
import CategoryModel from '../src/models/category.model.js'
import { generateSlug } from '../src/utils/slugGenerator.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, '..', '.env') })

const DATA_FILE = path.join(__dirname, 'data', 'category-hierarchy.tsv')
const BATCH_SIZE = 200

const connectionOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
}

const DEFAULT_URI =
  process.env.MONGO_URI || process.env.MONGODB_URI || process.env.DB_URL

const dbArg = process.argv[2]?.trim()

const buildMongoUri = (uri, dbName) => {
  if (!uri || !dbName) return uri
  const qIndex = uri.indexOf('?')
  const base = qIndex === -1 ? uri : uri.slice(0, qIndex)
  const query = qIndex === -1 ? '' : uri.slice(qIndex)
  const slash = base.lastIndexOf('/')
  if (slash === -1) return uri
  const afterSlash = base.slice(slash + 1)
  if (!afterSlash || afterSlash.includes('@')) return uri
  return `${base.slice(0, slash)}/${dbName}${query}`
}

const MONGO_URI = buildMongoUri(DEFAULT_URI, dbArg)

const normalizeKey = (value) =>
  String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase()

const cleanName = (value) =>
  String(value || '')
    .trim()
    .replace(/\s+/g, ' ')

const parseTsv = (content) => {
  const rows = []
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const parts = line.split('\t')
    if (parts.length < 2) continue
    const [group, category, subcategory, status] = parts
    if (!group?.trim() || !category?.trim()) continue
    rows.push({
      group: cleanName(group),
      category: cleanName(category),
      subcategory: cleanName(subcategory),
      status:
        (status || 'active').trim().toLowerCase() === 'inactive'
          ? 'inactive'
          : 'active',
    })
  }
  return rows
}

const nextRootCode = (index, existingMax) => {
  const n = Math.max(existingMax, 0) + index + 1
  return `MIG${String(n).padStart(2, '0')}`
}

const nextSubCode = (parentCode, index) =>
  `${parentCode}SUB${String(index + 1).padStart(2, '0')}`

const uniqueSlug = (name, used) => {
  let base = generateSlug(name) || 'category'
  let slug = base
  let i = 1
  while (used.has(slug)) {
    slug = `${base}-${i++}`
  }
  used.add(slug)
  return slug
}

const insertBatches = async (docs) => {
  let inserted = 0
  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const chunk = docs.slice(i, i + BATCH_SIZE)
    const res = await CategoryModel.insertMany(chunk, { ordered: false })
    inserted += res.length
  }
  return inserted
}

async function main() {
  if (!MONGO_URI) {
    console.error('MONGODB_URI / MONGO_URI / DB_URL is not set in .env')
    process.exit(1)
  }
  if (!fs.existsSync(DATA_FILE)) {
    console.error(`Data file not found: ${DATA_FILE}`)
    process.exit(1)
  }

  const rows = parseTsv(fs.readFileSync(DATA_FILE, 'utf8'))
  console.log(`Parsed ${rows.length} rows from TSV`)

  try {
    console.log('Connecting to database...')
    await mongoose.connect(MONGO_URI, connectionOptions)
    console.log(`Connected to: ${mongoose.connection.name}\n`)

    const groupDocs = await GroupModel.find({ isDeleted: false }).lean()
    const groupMap = new Map(groupDocs.map((g) => [normalizeKey(g.name), g]))

    const missingGroups = new Set()
    for (const row of rows) {
      if (!groupMap.has(normalizeKey(row.group))) {
        missingGroups.add(row.group)
      }
    }
    if (missingGroups.size) {
      console.error('Missing groups in database:')
      for (const g of missingGroups) console.error(`  - ${g}`)
      process.exit(1)
    }

    const existingRoots = await CategoryModel.find({
      parent: null,
      isDeleted: false,
    }).lean()
    const existingSubs = await CategoryModel.find({
      parent: { $ne: null },
      isDeleted: false,
    }).lean()

    const rootMap = new Map()
    for (const c of existingRoots) {
      rootMap.set(`${c.group}|${normalizeKey(c.name)}`, c)
    }

    const subMap = new Map()
    for (const c of existingSubs) {
      subMap.set(`${c.parent}|${normalizeKey(c.name)}`, c)
    }

    const usedSlugs = new Set(
      [...existingRoots, ...existingSubs].map((c) => c.slug).filter(Boolean)
    )

    let rootCodeMax = 0
    for (const c of existingRoots) {
      const m = c.categoryCode?.match(/^MIG(\d+)$/i)
      if (m) rootCodeMax = Math.max(rootCodeMax, parseInt(m[1], 10))
    }

    const uniqueRoots = new Map()
    for (const row of rows) {
      const group = groupMap.get(normalizeKey(row.group))
      const key = `${group._id}|${normalizeKey(row.category)}`
      if (!uniqueRoots.has(key)) {
        uniqueRoots.set(key, {
          groupId: group._id,
          name: row.category,
          status: row.status,
        })
      }
    }

    const rootsToInsert = []
    let rootCreateIndex = 0
    for (const [key, item] of uniqueRoots) {
      if (rootMap.has(key)) continue
      const categoryCode = nextRootCode(rootCreateIndex, rootCodeMax)
      rootCreateIndex++
      const doc = {
        name: item.name,
        slug: uniqueSlug(item.name, usedSlugs),
        group: item.groupId,
        parent: null,
        categoryCode,
        status: item.status,
        description: '',
        sortOrder: 0,
      }
      rootsToInsert.push({ key, doc })
    }

    if (rootsToInsert.length) {
      console.log(`Inserting ${rootsToInsert.length} root categories...`)
      const inserted = await insertBatches(rootsToInsert.map((r) => r.doc))
      const freshRoots = await CategoryModel.find({
        categoryCode: { $in: rootsToInsert.map((r) => r.doc.categoryCode) },
        isDeleted: false,
      }).lean()

      const codeToDoc = new Map(freshRoots.map((c) => [c.categoryCode, c]))
      for (const { key, doc } of rootsToInsert) {
        const created = codeToDoc.get(doc.categoryCode)
        if (created) rootMap.set(key, created)
      }
      console.log(`Root categories inserted: ${inserted}`)
    } else {
      console.log('All root categories already exist.')
    }

    const subsToInsert = []
    const subCountByParent = new Map()

    for (const c of existingSubs) {
      const m = c.categoryCode?.match(/SUB(\d+)$/i)
      if (m && c.parent) {
        const n = parseInt(m[1], 10)
        const pid = String(c.parent)
        subCountByParent.set(pid, Math.max(subCountByParent.get(pid) || 0, n))
      }
    }

    const pendingSubKeys = new Set()

    for (const row of rows) {
      if (!row.subcategory) continue
      const group = groupMap.get(normalizeKey(row.group))
      const rootKey = `${group._id}|${normalizeKey(row.category)}`
      const parent = rootMap.get(rootKey)
      if (!parent) continue

      const subKey = `${parent._id}|${normalizeKey(row.subcategory)}`
      if (subMap.has(subKey) || pendingSubKeys.has(subKey)) continue

      const parentId = String(parent._id)
      const parentCode = parent.categoryCode
      if (!parentCode) continue

      pendingSubKeys.add(subKey)

      const subIndex = subCountByParent.get(parentId) || 0
      const categoryCode = nextSubCode(parentCode, subIndex)
      subCountByParent.set(parentId, subIndex + 1)

      const doc = {
        name: row.subcategory,
        slug: uniqueSlug(`${row.category}-${row.subcategory}`, usedSlugs),
        group: group._id,
        parent: parent._id,
        categoryCode,
        status: row.status,
        description: '',
        sortOrder: 0,
      }
      subsToInsert.push({ subKey, doc })
      subMap.set(subKey, { _id: 'pending' })
    }

    if (subsToInsert.length) {
      console.log(`Inserting ${subsToInsert.length} subcategories...`)
      const inserted = await insertBatches(subsToInsert.map((s) => s.doc))
      console.log(`Subcategories inserted: ${inserted}`)
    } else {
      console.log('All subcategories already exist.')
    }

    const totalCategories = await CategoryModel.countDocuments({
      parent: null,
      isDeleted: false,
    })
    const totalSubcategories = await CategoryModel.countDocuments({
      parent: { $ne: null },
      isDeleted: false,
    })

    console.log('\n--- Summary ---')
    console.log(`Root categories in DB:  ${totalCategories}`)
    console.log(`Subcategories in DB:    ${totalSubcategories}`)
    console.log(`TSV rows processed:     ${rows.length}`)
    console.log('Seed completed successfully.')
  } catch (err) {
    console.error('Seed failed:', err)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
    console.log('Disconnected.')
    process.exit(0)
  }
}

main()
