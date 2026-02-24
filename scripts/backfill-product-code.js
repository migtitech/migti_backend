/**
 * Migration script: Backfill productCode for existing products that don't have one.
 * Run from migti_backend: node scripts/backfill-product-code.js
 * Or add to package.json: "backfill:productCode": "node scripts/backfill-product-code.js"
 */

import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import path from 'path'

import ProductModel from '../src/models/product.model.js'
import { generateUniqueProductCode } from '../src/utils/productCodeGenerator.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, '..', '.env') })

const connectionOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
}

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb+srv://migtitech_db_user:Migti01456@cluster0.hhjdyl9.mongodb.net/development?retryWrites=true&w=majority&appName=Cluster0'

async function backfillProductCodes() {
  try {
    console.log('Connecting to database...')
    await mongoose.connect(MONGO_URI, connectionOptions)
    console.log('Connected.')

    const productsWithoutCode = await ProductModel.find({
      $or: [{ productCode: { $exists: false } }, { productCode: null }, { productCode: '' }],
      isDeleted: { $ne: true },
    }).lean()

    console.log(`Found ${productsWithoutCode.length} products without productCode.`)

    let updated = 0
    if (productsWithoutCode.length > 0) {
      for (const p of productsWithoutCode) {
        const code = await generateUniqueProductCode()
        await ProductModel.findByIdAndUpdate(p._id, { productCode: code })
        updated++
        console.log(`[${updated}/${productsWithoutCode.length}] ${p.name} -> ${code}`)
      }
    }

    console.log(`\nBackfilling variant codes for products with variants...`)

    const productsWithVariants = await ProductModel.find({
      productCode: { $exists: true, $ne: null, $ne: '' },
      hasVariants: true,
      'variantCombinations.0': { $exists: true },
      isDeleted: { $ne: true },
    }).lean()

    let variantUpdated = 0
    for (const p of productsWithVariants) {
      const vcs = p.variantCombinations || []
      if (vcs.length === 0) continue

      const needsVariantCode = vcs.some((vc) => !vc.variantCode || vc.variantCode === '')
      if (!needsVariantCode) continue

      const variantCombinations = vcs.map((vc, i) => ({
        ...vc,
        variantCode: `${p.productCode}v${i + 1}`,
      }))
      await ProductModel.findByIdAndUpdate(p._id, { variantCombinations })
      variantUpdated++
      console.log(`  ${p.name} -> ${variantCombinations.map((vc) => vc.variantCode).join(', ')}`)
    }

    console.log(`\nBackfill complete. Updated ${updated} products, ${variantUpdated} products with variant codes.`)
  } catch (err) {
    console.error('Backfill failed:', err)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
    console.log('Disconnected.')
    process.exit(0)
  }
}

backfillProductCodes()
