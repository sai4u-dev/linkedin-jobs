import express from 'express'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import { connectDb } from './db.js'
import { Job } from './models/Job.js'
import { Dataset } from './models/Dataset.js'
import { requireAuth } from './middleware/auth.js'

dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 4000

app.use(cors())
app.use(express.json())

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

app.get('/api/health', (req, res) => {
  res.json({ ok: true, db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' })
})

const DEFAULT_ADMIN_EMAILS = [
  'tannirusainarendra81@gmail.com',
  'vbandaru@acciojob.com',
  'niteshgadghar@acciojob.com',
]

const ADMIN_NAMES = {
  'tannirusainarendra81@gmail.com': 'Tanni Rusa Narendra',
  'vbandaru@acciojob.com': 'V Bandaru',
  'niteshgadghar@acciojob.com': 'Nitesh Gadghar',
}

function adminEmails() {
  const configured = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
  return configured.length ? configured : DEFAULT_ADMIN_EMAILS
}

function displayName(email) {
  if (ADMIN_NAMES[email]) return ADMIN_NAMES[email]
  const local = email.split('@')[0].replace(/[._-]+/g, ' ').replace(/\d+/g, ' ').trim()
  return local.replace(/\b\w/g, (char) => char.toUpperCase()) || 'Administrator'
}

app.post('/api/auth/login', (req, res) => {
  const { email, username, password } = req.body || {}
  const identifier = String(email || username || '').trim().toLowerCase()
  const validPass = process.env.ADMIN_PASSWORD || 'acciojob@123'

  if (!identifier || !password || !adminEmails().includes(identifier) || password !== validPass) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }

  const name = displayName(identifier)
  const token = jwt.sign(
    { sub: identifier, email: identifier, name, role: 'admin' },
    process.env.JWT_SECRET || 'dev-secret',
    { expiresIn: '12h' }
  )

  res.json({
    token,
    user: { email: identifier, username: identifier, name, role: 'admin' },
  })
})

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({
    user: {
      email: req.user.email || req.user.sub,
      username: req.user.sub,
      name: req.user.name,
      role: req.user.role,
    },
  })
})

app.get('/api/dataset', requireAuth, async (req, res) => {
  const [dataset, total] = await Promise.all([
    Dataset.findOne({ key: 'default' }).lean(),
    Job.countDocuments({}),
  ])
  res.json({ ...(dataset || {}), total_listings: total })
})

app.get('/api/overview', requireAuth, async (req, res) => {
  const [total, companies, filterAgg, locationAgg, primaryAgg, recent, hoursAgg, multiFilter, dataset] =
    await Promise.all([
      Job.countDocuments({}),
      Job.distinct('company'),
      Job.aggregate([
        { $unwind: '$matched_searches' },
        { $group: { _id: '$matched_searches', count: { $sum: 1 } } },
        { $sort: { count: -1, _id: 1 } },
      ]),
      Job.aggregate([
        { $group: { _id: '$city', count: { $sum: 1 } } },
        { $sort: { count: -1, _id: 1 } },
        { $limit: 8 },
      ]),
      Job.aggregate([
        { $group: { _id: '$search_keyword', count: { $sum: 1 } } },
        { $sort: { count: -1, _id: 1 } },
      ]),
      Job.find({}).sort({ posted_hours: 1, order: 1 }).limit(6).lean(),
      Job.find({ posted_hours: { $ne: null } }).select('posted_hours').lean(),
      Job.countDocuments({ 'matched_searches.1': { $exists: true } }),
      Dataset.findOne({ key: 'default' }).lean(),
    ])

  const buckets = [
    { label: '0–1h', min: 0, max: 1 },
    { label: '1–3h', min: 1, max: 3 },
    { label: '3–6h', min: 3, max: 6 },
    { label: '6–12h', min: 6, max: 12 },
    { label: '12–24h', min: 12, max: 24 },
    { label: '24h+', min: 24, max: Infinity },
  ].map((bucket) => {
    const count = hoursAgg.filter(
      (job) => job.posted_hours >= bucket.min && job.posted_hours < bucket.max
    ).length
    return { label: bucket.label, count }
  })

  const hours = hoursAgg.map((job) => job.posted_hours)
  const avgHours = hours.length
    ? Math.round((hours.reduce((sum, value) => sum + value, 0) / hours.length) * 10) / 10
    : 0

  const searchStatus = dataset?.searches || []
  const searchSummary = {
    total: searchStatus.length,
    collected: searchStatus.filter((item) => item.results_collected).length,
    unavailable: searchStatus.filter((item) => !item.results_collected).length,
  }

  res.json({
    stats: {
      total,
      companies: companies.length,
      filters: filterAgg.length,
      locations: new Set(locationAgg.map((item) => item._id)).size,
      multiFilter,
      avgHours,
      latestPostedHours: recent[0]?.posted_hours ?? null,
    },
    filterCounts: filterAgg.map((item) => ({ name: item._id, count: item.count })),
    locationCounts: locationAgg.map((item) => ({ name: item._id, count: item.count })),
    primarySearchCounts: primaryAgg.map((item) => ({ name: item._id || 'Unknown', count: item.count })),
    postedBuckets: buckets,
    recent,
    dataset: dataset || null,
    searchSummary,
  })
})

app.get('/api/jobs', requireAuth, async (req, res) => {
  const {
    q = '',
    filter = '',
    location = '',
    sort = 'order',
    page = '1',
    limit = '9',
  } = req.query

  const query = {}
  if (q.trim()) {
    const rx = new RegExp(escapeRegex(q.trim()), 'i')
    query.$or = [{ title: rx }, { company: rx }, { location: rx }]
  }
  if (filter) query.matched_searches = filter
  if (location) {
    const rx = new RegExp(escapeRegex(location.trim()), 'i')
    query.$or = [...(query.$or || []), { city: rx }, { region: rx }, { location: rx }, { search_keyword: rx }]
  }

  const sortMap = {
    order: { order: 1 },
    recent: { posted_hours: 1, order: 1 },
    oldest: { posted_hours: -1, order: 1 },
    company: { company: 1, order: 1 },
    title: { title: 1, order: 1 },
  }

  const pageNum = Math.max(1, Number.parseInt(page, 10) || 1)
  const pageSize = Math.min(50, Math.max(1, Number.parseInt(limit, 10) || 9))

  const [items, total, filterAgg, locationAgg] = await Promise.all([
    Job.find(query)
      .sort(sortMap[sort] || sortMap.order)
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    Job.countDocuments(query),
    Job.aggregate([
      { $unwind: '$matched_searches' },
      { $group: { _id: '$matched_searches', count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
    ]),
    Job.aggregate([
      { $group: { _id: '$city', count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
      { $limit: 20 },
    ]),
  ])

  res.json({
    items,
    total,
    page: pageNum,
    pages: Math.max(1, Math.ceil(total / pageSize)),
    limit: pageSize,
    facets: {
      filters: filterAgg.map((item) => ({ name: item._id, count: item.count })),
      locations: locationAgg.map((item) => ({ name: item._id, count: item.count })),
    },
  })
})

app.get('/api/jobs/:id', requireAuth, async (req, res) => {
  const { id } = req.params
  const job = mongoose.isValidObjectId(id)
    ? await Job.findById(id).lean()
    : await Job.findOne({ job_url: id }).lean()

  if (!job) return res.status(404).json({ error: 'Job not found' })
  res.json(job)
})

const distPath = path.resolve(__dirname, '..', 'dist')
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath))
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
  })
}

app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: 'Something went wrong on the server' })
})

const isDirectRun =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (isDirectRun) {
  connectDb()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`JobLens API listening on http://localhost:${PORT}`)
      })
    })
    .catch((error) => {
      console.error('Failed to connect to MongoDB:', error.message)
      process.exit(1)
    })
}

export { app }
export default app
