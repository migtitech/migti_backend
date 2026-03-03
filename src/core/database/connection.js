import mongoose from 'mongoose'
import dotenv from 'dotenv'
dotenv.config()
const connectDB = async () => {
  const uri = process.env.MONGODB_URI || process.env.DB_URL || 'mongodb://127.0.0.1:27017/'

  const connectionOptions = {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  }

  try {
    console.log('Attempting to connect to database...')
    await mongoose.connect(uri, connectionOptions)
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
