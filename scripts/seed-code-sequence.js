/**
 * Ensures the code_sequence singleton document exists with all counters at 999
 * so the first generated code for each type is 1000.
 * Run from migti_backend: node scripts/seed-code-sequence.js
 */

import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import path from 'path'

import CodeSequenceModel, { CODE_SEQUENCE_ID } from '../src/models/codeSequence.model.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, '..', '.env') })

const INITIAL_VALUE = 999

const connectionOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
}

const MONGO_URI =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  'mongodb+srv://migtitech_db_user:Migti01456@cluster0.hhjdyl9.mongodb.net/development?retryWrites=true&w=majority&appName=Cluster0'

async function seedCodeSequence() {
  try {
    console.log('Connecting to database...')
    await mongoose.connect(MONGO_URI, connectionOptions)
    console.log('Connected.')

    const doc = await CodeSequenceModel.findById(CODE_SEQUENCE_ID).lean()
    if (doc) {
      console.log('Code sequence document already exists. Current values:', doc)
      return
    }

    await CodeSequenceModel.create({
      _id: CODE_SEQUENCE_ID,
      companyCode: INITIAL_VALUE,
      branchCode: INITIAL_VALUE,
      zoneCode: INITIAL_VALUE,
      groupCode: INITIAL_VALUE,
      categoryCode: INITIAL_VALUE,
      productCode: INITIAL_VALUE,
      queryCode: INITIAL_VALUE,
      quotationCode: INITIAL_VALUE,
    })
    console.log('Code sequence document created with all counters at', INITIAL_VALUE, '(first generated code will be 1000).')
  } catch (err) {
    console.error('Seed failed:', err)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
    console.log('Disconnected.')
    process.exit(0)
  }
}

seedCodeSequence()
