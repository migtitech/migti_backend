/**
 * Seed product groups.
 * Run: node scripts/seed-groups.js [dbName]
 * Example: node scripts/seed-groups.js migtiapp
 */

import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import path from 'path'

import GroupModel from '../src/models/group.model.js'
import { addGroup } from '../src/services/group/group.service.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, '..', '.env') })

const GROUPS = [
  'CHEMICALS',
  'CLEANING & HOUSEKEEPING',
  'COMPUTER & IT',
  '(ESD) ELECTRO-STATIC DEVICES',
  'ELECTRICALS',
  'ELECTRONICS',
  'FASTENERS',
  'HAND TOOLS',
  'HARDWARE & SANITARY ITEMS',
  'HOSPITALITY',
  'HYDRAULICS',
  'INDUSTRIAL SAFETY & FIRE',
  'MANUFACTURE INFRA',
  'OFFICE SUPPLIES & STATIONARY',
  'PACKAGING & ADHESIVES',
  'PNEUMATICS',
  'POWER TOOLS',
  'POWER TRANSMISSION',
  'PROCESSING TOOLS & CUTTING',
  'ROBOTICS & AUTOMATION EQUIPMENT',
  'TEST & MEASURE EQUIPMENT',
]

const connectionOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
}

const DEFAULT_URI =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  process.env.DB_URL

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

async function main() {
  if (!MONGO_URI) {
    console.error('MONGODB_URI / MONGO_URI / DB_URL is not set in .env')
    process.exit(1)
  }

  try {
    console.log('Connecting to database...')
    await mongoose.connect(MONGO_URI, connectionOptions)
    console.log(`Connected to: ${mongoose.connection.name}\n`)

    const created = []
    const skipped = []

    for (const name of GROUPS) {
      const existing = await GroupModel.findOne({
        name: { $regex: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
        isDeleted: false,
      }).lean()

      if (existing) {
        skipped.push({ name, code: existing.code, id: existing._id })
        console.log(`SKIP (exists): ${name} [${existing.code}]`)
        continue
      }

      const group = await addGroup({ name, status: 'active' })
      created.push({ name: group.name, code: group.code, id: group._id })
      console.log(`CREATED: ${group.name} [${group.code}]`)
    }

    console.log('\n--- Summary ---')
    console.log(`Created: ${created.length}`)
    console.log(`Skipped: ${skipped.length}`)
    console.log(`Total in list: ${GROUPS.length}`)
  } catch (err) {
    console.error('Seed failed:', err)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
    console.log('\nDisconnected.')
    process.exit(0)
  }
}

main()
