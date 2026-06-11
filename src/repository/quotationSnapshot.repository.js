import QuotationSnapshotModel from '../models/quotationSnapshot.model.js'

export const countQuotationSnapshotsByQuotationId = (quotationId) =>
  QuotationSnapshotModel.countDocuments({ quotationId })

export const createQuotationSnapshot = (data) =>
  QuotationSnapshotModel.create(data)

export const findQuotationSnapshotsByQuotationId = (quotationId) =>
  QuotationSnapshotModel.find({
    quotationId,
  })
    .sort({ revision: -1 })
    .select('revision snapshotCode payload createdAt approvedBy')
    .lean()
