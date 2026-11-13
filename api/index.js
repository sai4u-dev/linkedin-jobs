import app from '../server/index.js'
import { connectDb } from '../server/db.js'

let connectionPromise = null

function ensureDb() {
  if (!connectionPromise) {
    connectionPromise = connectDb().catch((error) => {
      connectionPromise = null
      throw error
    })
  }
  return connectionPromise
}

export default async function handler(req, res) {
  try {
    await ensureDb()
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error.message)
    res.status(500).json({ error: 'Database connection failed' })
    return
  }

  return app(req, res)
}
