import QuotationFollowupModel, {
  QUOTATION_FOLLOWUP_STATUS,
} from '../models/quotationFollowup.model.js'

export { QUOTATION_FOLLOWUP_STATUS }

export const findOneQuotationFollowupLean = (filter) =>
  QuotationFollowupModel.findOne(filter).lean()

export const createQuotationFollowup = (data) =>
  QuotationFollowupModel.create(data)

export const findQuotationFollowupsByQuotationIds = (quotationIds) =>
  QuotationFollowupModel.find({
    quotationId: { $in: quotationIds },
    isDeleted: false,
  })
    .select('quotationId industry_id')
    .lean()

export const updateOneQuotationFollowup = (filter, update) =>
  QuotationFollowupModel.updateOne(filter, update)

export const findQuotationFollowups = (filter, { skip, limit }) =>
  QuotationFollowupModel.find(filter)
    .sort({ followup_date: 1, createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('zoneId', 'name city')
    .populate('salesEmployeeId', 'name email phone role')
    .populate('industry_id', 'name location')
    .populate('followupHistory.followedUpBy', 'name email phone role')
    .lean()

export const countQuotationFollowups = (filter) =>
  QuotationFollowupModel.countDocuments(filter)

export const findByIdAndUpdateQuotationFollowup = (id, update, options) =>
  QuotationFollowupModel.findByIdAndUpdate(id, update, options)
    .populate('zoneId', 'name city')
    .populate('salesEmployeeId', 'name email phone role')
    .populate('industry_id', 'name location')
    .populate('followupHistory.followedUpBy', 'name email phone role')
    .lean()
