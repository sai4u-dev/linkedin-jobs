import mongoose from 'mongoose'

const searchSchema = new mongoose.Schema(
  {
    keyword: { type: String, default: '' },
    source_url: { type: String, default: '' },
    page_title: { type: String, default: '' },
    visible_card_count: { type: Number, default: 0 },
    results_collected: { type: Boolean, default: false },
    collected_at: { type: String, default: '' },
  },
  { _id: false }
)

const datasetSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, default: 'default' },
    collected_at: { type: String, default: '' },
    collected_date: { type: String, default: '' },
    timezone: { type: String, default: '' },
    filters: { type: mongoose.Schema.Types.Mixed, default: {} },
    source_reference: { type: String, default: '' },
    posting_time_note: { type: String, default: '' },
    searches: { type: [searchSchema], default: [] },
    result_count: { type: Number, default: 0 },
    scope_note: { type: String, default: '' },
    source_file: { type: String, default: 'todaytimeanddate.json' },
    seeded_at: { type: Date, default: Date.now },
  },
  { minimize: false }
)

export const Dataset = mongoose.model('Dataset', datasetSchema)
