/**
 * Ensures performance indexes exist. Safe to run multiple times.
 * Usage: node scripts/ensure-performance-indexes.js
 */
import 'dotenv/config'
import connectDB from '../src/core/database/connection.js'
import QueryModel from '../src/models/query.model.js'
import QuotationModel from '../src/models/quotation.model.js'
import QueryProductModel from '../src/models/queryProduct.model.js'
import IndustryModel from '../src/models/industry.model.js'
import ProductModel from '../src/models/product.model.js'

const models = [
  QueryModel,
  QuotationModel,
  QueryProductModel,
  IndustryModel,
  ProductModel,
]

const run = async () => {
  await connectDB()
  for (const Model of models) {
    const name = Model.collection.collectionName
    console.log(`Syncing indexes for ${name}...`)
    await Model.syncIndexes()
    console.log(`Done: ${name}`)
  }
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
