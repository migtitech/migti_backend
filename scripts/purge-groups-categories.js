/**
 * Deletes all groups, categories, and subcategories.
 * Clears ObjectId references in dependent collections first.
 * Run from migti_backend: node scripts/purge-groups-categories.js
 */

import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import path from 'path'

import GroupModel from '../src/models/group.model.js'
import CategoryModel from '../src/models/category.model.js'
import ProductModel from '../src/models/product.model.js'
import EmployeeModel from '../src/models/employee.model.js'
import SupplierModel from '../src/models/supplier.model.js'
import QueryModel from '../src/models/query.model.js'
import QueryProductModel from '../src/models/queryProduct.model.js'
import QueryNewProductModel from '../src/models/queryNewProduct.model.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, '..', '.env') })

const connectionOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
}

const DEFAULT_URI =
  process.env.MONGO_URI || process.env.MONGODB_URI || process.env.DB_URL

/** Optional: node scripts/purge-groups-categories.js migtiapp */
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

async function countAll() {
  const [groups, categories, subcategories, products] = await Promise.all([
    GroupModel.countDocuments({}),
    CategoryModel.countDocuments({ parent: null }),
    CategoryModel.countDocuments({ parent: { $ne: null } }),
    ProductModel.countDocuments({
      isDeleted: false,
      $or: [
        { group: { $ne: null } },
        { category: { $ne: null } },
        { subcategory: { $ne: null } },
      ],
    }),
  ])
  return { groups, categories, subcategories, products }
}

async function clearReferences() {
  const [
    products,
    employees,
    suppliers,
    queries,
    queryProducts,
    queryNewProducts,
  ] = await Promise.all([
    ProductModel.updateMany(
      { isDeleted: false },
      { $set: { group: null, category: null, subcategory: null } }
    ),
    EmployeeModel.updateMany(
      { isDeleted: false },
      { $set: { assigned_groups: [] } }
    ),
    SupplierModel.updateMany(
      { isDeleted: false },
      { $set: { categories: [] } }
    ),
    QueryModel.updateMany(
      { isDeleted: false },
      {
        $set: { 'products.$[].groupId': null, 'products.$[].categoryId': null },
      }
    ),
    QueryProductModel.updateMany(
      { isDeleted: false },
      { $set: { groupId: null, categoryId: null } }
    ),
    QueryNewProductModel.updateMany(
      { isDeleted: false },
      { $set: { groupId: null, categoryId: null } }
    ),
  ])

  return {
    products: products.modifiedCount,
    employees: employees.modifiedCount,
    suppliers: suppliers.modifiedCount,
    queries: queries.modifiedCount,
    queryProducts: queryProducts.modifiedCount,
    queryNewProducts: queryNewProducts.modifiedCount,
  }
}

async function purgeTaxonomy() {
  const categoryResult = await CategoryModel.deleteMany({})
  const groupResult = await GroupModel.deleteMany({})
  return {
    categoriesDeleted: categoryResult.deletedCount,
    groupsDeleted: groupResult.deletedCount,
  }
}

async function main() {
  if (!MONGO_URI) {
    console.error('MONGODB_URI / MONGO_URI / DB_URL is not set in .env')
    process.exit(1)
  }

  try {
    console.log('Connecting to database...')
    await mongoose.connect(MONGO_URI, connectionOptions)
    console.log(`Connected to: ${mongoose.connection.name}\n`)

    const before = await countAll()
    console.log('Before purge:')
    console.log(`  Groups:         ${before.groups}`)
    console.log(`  Categories:     ${before.categories}`)
    console.log(`  Subcategories:  ${before.subcategories}`)
    console.log(`  Products linked: ${before.products}\n`)

    console.log('Clearing references in dependent collections...')
    const cleared = await clearReferences()
    console.log('References cleared:', cleared, '\n')

    console.log('Deleting all categories, subcategories, and groups...')
    const deleted = await purgeTaxonomy()
    console.log('Deleted:', deleted, '\n')

    const after = await countAll()
    console.log('After purge:')
    console.log(`  Groups:         ${after.groups}`)
    console.log(`  Categories:     ${after.categories}`)
    console.log(`  Subcategories:  ${after.subcategories}`)

    if (
      after.groups === 0 &&
      after.categories === 0 &&
      after.subcategories === 0
    ) {
      console.log('\nPurge completed successfully.')
    } else {
      console.error('\nPurge incomplete — some records remain.')
      process.exit(1)
    }
  } catch (err) {
    console.error('Purge failed:', err)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
    console.log('Disconnected.')
    process.exit(0)
  }
}

main()
