import 'dotenv/config'
import mongoose from 'mongoose'
import { database_urls } from './src/core/common/constant.js'

const dropEmailIndex = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(database_urls.connection + database_urls.db_name)
    console.log('✅ Connected to MongoDB')

    const db = mongoose.connection.db
    const collection = db.collection('judges')

    // Drop the email index
    try {
      await collection.dropIndex('email_1')
      console.log('✅ Successfully dropped email_1 index from judges collection')
    } catch (error) {
      if (error.code === 27) {
        console.log('ℹ️  Index email_1 does not exist (already removed)')
      } else {
        throw error
      }
    }

    // Optional: Remove email and password fields from all judge documents
    const result = await collection.updateMany(
      {},
      { 
        $unset: { 
          email: "",
          password: "" 
        } 
      }
    )
    console.log(`✅ Removed email and password fields from ${result.modifiedCount} judge documents`)

    console.log('\n✅ Migration completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

dropEmailIndex()

