import PoEntryModel from '../models/poEntry.model.js'

export const countPoEntries = (filter) => PoEntryModel.countDocuments(filter)

export const aggregatePoEntryAmount = (match) =>
  PoEntryModel.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ])

export const findPoEntriesForBranchAnalytics = (filter, skip, limit) =>
  PoEntryModel.find(filter)
    .select(
      'poNumber amount entryDate remark companyId salespersonId createdAt'
    )
    .populate('companyId', 'name')
    .populate('salespersonId', 'name')
    .sort({ entryDate: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()

const poEntryRepository = {
  find: (filter) => PoEntryModel.find(filter),
  findOne: (filter) => PoEntryModel.findOne(filter),
  findById: (id) => PoEntryModel.findById(id),
  create: (data) => PoEntryModel.create(data),
  updateOne: (filter, update, options) =>
    PoEntryModel.updateOne(filter, update, options),
  countDocuments: (filter) => PoEntryModel.countDocuments(filter),
  aggregate: (pipeline) => PoEntryModel.aggregate(pipeline),
}

export default poEntryRepository
