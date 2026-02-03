import 'dotenv/config'
import mongoose from 'mongoose'
import connectDB from './src/core/database/connection.js'
import SuperAdminModel from './src/models/super.admin.js'
import { encrypt } from './src/core/crypto/helper.cryto.js'

const SUPER_ADMIN_EMAIL = 'admin@gmail.com'
const SUPER_ADMIN_PASSWORD = 'admin123'
const SUPER_ADMIN_NAME = 'super admin'
async function seedSuperAdmin() {
  try {
    console.log('🚀 Starting super admin seed process...')

    console.log('📡 Connecting to database...')
    await connectDB()
    console.log('✅ Database connected successfully!')
    if (mongoose.connection.readyState !== 1) {
      throw new Error('Database connection is not ready')
    }

    const existing = await SuperAdminModel.findOne({
      email: SUPER_ADMIN_EMAIL,
    })

    if (existing) {
      console.log('ℹ️ Super admin already exists, skipping seed.')
      await mongoose.connection.close()
      console.log('🔌 Database connection closed')
      return
    }

    const payload = {
      name: SUPER_ADMIN_NAME,
      email: SUPER_ADMIN_EMAIL,
      password: encrypt(SUPER_ADMIN_PASSWORD),
    }

    await SuperAdminModel.create(payload)
    console.log('✅ Super admin created successfully!')

    await mongoose.connection.close()
    console.log('🔌 Database connection closed')
  } catch (error) {
    console.error('❌ Error seeding super admin:', error.message)
    console.error(error)

    try {
      await mongoose.connection.close()
      console.log('🔌 Database connection closed after error')
    } catch (closeError) {
      console.error('Error closing database connection:', closeError)
    }

    process.exit(1)
  }
}

seedSuperAdmin()

export { seedSuperAdmin }
