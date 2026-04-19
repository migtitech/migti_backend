/**
 * Migration: Backfill employee.zoneIds[] from legacy employee.zoneId.
 * Run from migti_backend: node scripts/backfill-employee-zone-ids.js
 * Or: npm run backfill:employeeZoneIds
 */

import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import path from 'path'

import EmployeeModel from '../src/models/employee.model.js'

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

const normalizeZoneIds = (zoneIds = [], zoneId = null) => {
  const out = []
  if (Array.isArray(zoneIds)) {
    for (const zid of zoneIds) {
      const s = String(zid || '').trim()
      if (s && !out.includes(s)) out.push(s)
    }
  }
  const legacy = String(zoneId || '').trim()
  if (!out.length && legacy) out.push(legacy)
  return out
}

async function backfillEmployeeZoneIds() {
  try {
    console.log('Connecting to database...')
    await mongoose.connect(MONGO_URI, connectionOptions)
    console.log('Connected.')

    const employees = await EmployeeModel.find({
      isDeleted: { $ne: true },
    })
      .select('_id name zoneId zoneIds')
      .lean()

    console.log(`Found ${employees.length} active employees.`)

    let updated = 0
    let unchanged = 0

    for (const emp of employees) {
      const nextZoneIds = normalizeZoneIds(emp.zoneIds, emp.zoneId)
      const prevZoneIds = normalizeZoneIds(emp.zoneIds, null)
      const changed =
        prevZoneIds.length !== nextZoneIds.length ||
        prevZoneIds.some((zid, idx) => zid !== nextZoneIds[idx])

      if (!changed) {
        unchanged++
        continue
      }

      await EmployeeModel.updateOne(
        { _id: emp._id },
        {
          $set: { zoneIds: nextZoneIds },
          $unset: { zoneId: 1 },
        },
      )
      updated++
      console.log(
        `[${updated}] ${emp.name || emp._id} -> [${nextZoneIds.join(', ')}]`,
      )
    }

    console.log(`\nBackfill complete. Updated ${updated}, unchanged ${unchanged}.`)
  } catch (err) {
    console.error('Migration failed:', err)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
    console.log('Disconnected.')
    process.exit(0)
  }
}

backfillEmployeeZoneIds()
