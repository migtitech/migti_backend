import mongoose from 'mongoose'
import dotenv from 'dotenv'
dotenv.config()
const connectDB = async () => {
  const dbenv = {
    dev:
      process.env.MONGODB_URI 
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

  } catch (error) {
    console.log(error)
  }
}

export default connectDB
