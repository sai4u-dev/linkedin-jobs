import mongoose from 'mongoose'

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    location: { type: String, default: '' },
    posted_time: { type: String, default: '' },
    posted_at: { type: Date, default: null },
    posted_date: { type: Date, default: null },
    posted_at_approx: { type: String, default: '' },
    posted_date_approx: { type: String, default: '' },
    posted_hours: { type: Number, default: null },
    job_url: { type: String, required: true, unique: true },
    apply_link: { type: String, default: '' },
    matched_searches: { type: [String], default: [] },
    positions_by_search: { type: Map, of: Number, default: {} },
    search_keyword: { type: String, default: '' },
    position_in_search: { type: Number, default: null },
    data_source: { type: String, default: '' },
    city: { type: String, default: '' },
    region: { type: String, default: '' },
    primary_search: { type: String, default: '' },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
)

jobSchema.index({ title: 'text', company: 'text', location: 'text' })
jobSchema.index({ order: 1 })
jobSchema.index({ posted_hours: 1 })
jobSchema.index({ posted_at: -1 })
jobSchema.index({ posted_date: -1 })
jobSchema.index({ matched_searches: 1 })
jobSchema.index({ search_keyword: 1 })
jobSchema.index({ data_source: 1 })

export const Job = mongoose.model('Job', jobSchema)
