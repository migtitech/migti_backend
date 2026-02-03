import mongoose from 'mongoose'
import CountryModel from './src/models/country.model.js'
import { seedCountries } from './src/core/helpers/countryData.js'
import connectDB from './src/core/database/connection.js'

async function seedCountryData() {
  try {
    console.log('🚀 Starting countries seed data process...')
    
    // Connect to database first
    console.log('📡 Connecting to database...')
    await connectDB()
    console.log('✅ Database connected successfully!')

    // Run the seed function
    console.log('🌱 Running countries seed data...')
    const result = await seedCountries(CountryModel)
    
    console.log('✅ Seed completed successfully!')
    console.log(`📊 Results:`, JSON.stringify(result, null, 2))
    
    // Close database connection
    await mongoose.connection.close()
    console.log('🔌 Database connection closed')

  } catch (error) {
    console.error('❌ Error seeding countries data:', error.message)
    console.error(error)
    
    // Ensure database connection is closed even on error
    try {
      await mongoose.connection.close()
      console.log('🔌 Database connection closed after error')
    } catch (closeError) {
      console.error('Error closing database connection:', closeError)
    }
    
    process.exit(1) // Exit with error code
  }
}

// Run the seed function directly
seedCountryData()

export { seedCountryData }
