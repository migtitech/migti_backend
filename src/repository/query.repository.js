import QueryModel from '../models/query.model.js'

export const clearIndustryIdFromQueries = (industryId) =>
  QueryModel.updateMany(
    { industry_id: industryId },
    { $set: { industry_id: null } }
  )

export const findQueryById = (filter, select) => {
  const q = QueryModel.findOne(filter)
  if (select) q.select(select)
  return q.lean()
}

export const appendConvertedQuotationOnQuery = (
  queryId,
  quotationId,
  quotationCode = ''
) =>
  QueryModel.updateOne(
    {
      _id: queryId,
      convertedQuotations: { $not: { $elemMatch: { quotationId } } },
    },
    {
      $push: {
        convertedQuotations: {
          quotationId,
          quotationCode: String(quotationCode || '').trim(),
        },
      },
    }
  )

export const pullConvertedQuotationFromQuery = (queryId, quotationId) =>
  QueryModel.updateOne(
    { _id: queryId },
    { $pull: { convertedQuotations: { quotationId } } }
  )

export const findQueryIdsLean = (filter) =>
  QueryModel.find(filter).select('_id').lean()

export const findQueryByIdSelectQueryCode = (id) =>
  QueryModel.findById(id).select('queryCode').lean()

export const findQueryByIdSelectBranchId = (id) =>
  QueryModel.findById(id).select('branchId').lean()

export const countQueries = (filter) => QueryModel.countDocuments(filter)

const queryRepository = {
  find: (filter) => QueryModel.find(filter),
  findOne: (filter) => QueryModel.findOne(filter),
  findById: (id) => QueryModel.findById(id),
  updateOne: (filter, update, options) =>
    QueryModel.updateOne(filter, update, options),
}

export default queryRepository
