import mongoose from 'mongoose'
import dotenv from 'dotenv'
dotenv.config()

const removeAllProductIndexes = async () => {
  try {
    const db = mongoose.connection.db
    if (!db) return
    const collection = db.collection('products')
    const indexes = await collection.indexes()
    const removableIndexes = indexes.filter((idx) => idx.name !== '_id_')
    for (const index of removableIndexes) {
      await collection.dropIndex(index.name)
      console.log(`Dropped products index: ${index.name}`)
    }
  } catch (error) {
    if (error?.codeName !== 'IndexNotFound' && error?.code !== 27) {
      console.warn('Failed to drop products indexes:', error.message)
    }
  }
}

const removeCategoryIndexes = async () => {
  try {
    const db = mongoose.connection.db
    if (!db) return
    const collection = db.collection('categories')
    const indexes = await collection.indexes()
    const removableIndexes = indexes.filter((idx) => idx.name !== '_id_')
    for (const index of removableIndexes) {
      await collection.dropIndex(index.name)
      console.log(`Dropped categories index: ${index.name}`)
    }
  } catch (error) {
    if (error?.codeName !== 'IndexNotFound' && error?.code !== 27) {
      console.warn('Failed to drop categories indexes:', error.message)
    }
  }
}

const connectDB = async () => {
  const dbenv = {
    dev:
      process.env.MONGODB_URI 
      // 'mongodb://127.0.0.1:27017/migti-crm-dev',
  }

  const connectionOptions = {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  }

  try {
    console.log('Attempting to connect to database...')
    await mongoose.connect(dbenv.dev, connectionOptions)
    await new Promise((resolve, reject) => {
      if (mongoose.connection.readyState === 1) {
        resolve()
      } else {
        mongoose.connection.once('open', resolve)
        mongoose.connection.once('error', reject)
      }
    })
    console.log('Database connected successfully')
    await removeAllProductIndexes()
    await removeCategoryIndexes()
  } catch (error) {
    console.error('Database connection error:', error.message)

    // In development (or when ENV is not set), don't crash the server.
    // Only exit in non-dev environments.
    if (process.env.ENV && process.env.ENV !== 'development') {
      process.exit(1)
    }
  }
}

export default connectDB
