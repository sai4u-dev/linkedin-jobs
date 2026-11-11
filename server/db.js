import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

export async function connectDb() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/joblens'
  mongoose.set('strictQuery', true)
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 })
  return mongoose.connection
}
