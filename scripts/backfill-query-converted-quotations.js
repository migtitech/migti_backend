/**
 * Migration: Backfill query.convertedQuotations from existing quotations (queryId link).
 * Run from migti_backend: node scripts/backfill-query-converted-quotations.js
 * Or: npm run backfill:queryConvertedQuotations
 */

import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import path from 'path'

import QueryModel from '../src/models/query.model.js'
import QuotationModel from '../src/models/quotation.model.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, '..', '.env') })

const connectionOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
}

const MONGO_URI =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  'mongodb+srv://migtitech_db_user:Migti01456@cluster0.hhjdyl9.mongodb.net/development?retryWrites=true&w=majority&appName=Cluster0'

async function backfillQueryConvertedQuotations() {
  try {
    console.log('Connecting to database...')
    await mongoose.connect(MONGO_URI, connectionOptions)
    console.log('Connected.')

    const grouped = await QuotationModel.aggregate([
      {
        $match: {
          isDeleted: { $ne: true },
          queryId: { $exists: true, $ne: null },
        },
      },
      { $sort: { createdAt: 1 } },
      {
        $group: {
          _id: '$queryId',
          refs: {
            $push: {
              quotationId: '$_id',
              quotationCode: { $ifNull: ['$quotationCode', ''] },
            },
          },
        },
      },
    ])

    console.log(`Found ${grouped.length} queries with at least one quotation.`)

    let updated = 0
    let skipped = 0

    const dedupeRefs = (refs) => {
      const seen = new Set()
      const out = []
      for (const r of refs) {
        const id = String(r.quotationId)
        if (seen.has(id)) continue
        seen.add(id)
        out.push({
          quotationId: r.quotationId,
          quotationCode: String(r.quotationCode || '').trim(),
        })
      }
      return out
    }

    for (const row of grouped) {
      const queryId = row._id
      const refs = dedupeRefs(
        (row.refs || []).map((r) => ({
          quotationId: r.quotationId,
          quotationCode: String(r.quotationCode || '').trim(),
        }))
      )

      const query = await QueryModel.findOne({
        _id: queryId,
        isDeleted: { $ne: true },
      })
        .select('_id queryCode convertedQuotations')
        .lean()

      if (!query) {
        skipped++
        console.warn(
          `Skip: query ${queryId} missing or deleted (${refs.length} quotation(s) orphaned).`
        )
        continue
      }

      await QueryModel.updateOne(
        { _id: queryId },
        { $set: { convertedQuotations: refs } }
      )
      updated++
      console.log(
        `[${updated}] ${query.queryCode || queryId} <- ${refs.length} quotation(s): ${refs.map((r) => r.quotationCode || r.quotationId).join(', ')}`
      )
    }

    console.log(
      `\nDone. Updated ${updated} queries, skipped ${skipped} (missing query).`
    )
  } catch (err) {
    console.error('Migration failed:', err)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
    console.log('Disconnected.')
    process.exit(0)
  }
}

backfillQueryConvertedQuotations()
