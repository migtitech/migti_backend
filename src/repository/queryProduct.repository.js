import QueryProductModel from '../models/queryProduct.model.js'

export { PRO_BUCKET_STATUS, deriveProBucketStatus } from '../models/queryProduct.model.js'

export const deleteQueryProductsByQueryId = (queryId) =>
  QueryProductModel.deleteMany({ queryId })

export const findQueryProductsByQueryId = (queryId) =>
  QueryProductModel.find({ queryId, isDeleted: false })

export const findQueryProductsForRatesCarryOver = (queryId) =>
  QueryProductModel.find({ queryId, isDeleted: false })
    .select('rawProductCode rates lineIndex')
    .lean()

export const insertQueryProducts = (docs) => QueryProductModel.insertMany(docs)

export const softDeleteQueryProductsByQueryId = (queryId) =>
  QueryProductModel.updateMany({ queryId }, { $set: { isDeleted: true } })

export const aggregateQueryProductRateAvailableCounts = (queryIds, statusMatch) =>
  QueryProductModel.aggregate([
    {
      $match: {
        isDeleted: { $ne: true },
        queryId: { $in: queryIds },
        status: { $in: statusMatch },
      },
    },
    {
      $group: {
        _id: '$queryId',
        count: { $sum: 1 },
      },
    },
  ])

export const aggregateQueryProductStatsByQueryIds = (queryIds, statusMatch) =>
  QueryProductModel.aggregate([
    {
      $match: {
        queryId: { $in: queryIds },
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: '$queryId',
        queryProductItemCount: { $sum: 1 },
        queryProductRateSubmittedOrFulfilledCount: {
          $sum: {
            $cond: [
              {
                $in: ['$status', statusMatch],
              },
              1,
              0,
            ],
          },
        },
      },
    },
  ])

export const countQueryProducts = (filter) =>
  QueryProductModel.countDocuments(filter)

export const findQueryProductsForProBucketList = (filter, { skip, limit }) =>
  QueryProductModel.find(filter)
    .sort({ createdAt: -1, lineIndex: 1 })
    .skip(skip)
    .limit(limit)
    .populate('groupId', 'name _id')
    .populate('categoryId', 'name _id')
    .populate('images', 'name path mimetype _id')
    .lean()

export const findQueryProductByIdSelectId = (filter) =>
  QueryProductModel.findOne(filter).select('_id').lean()

export const findQueryProductByIdWithProBucketPopulates = (id) =>
  QueryProductModel.findById(id)
    .populate('groupId', 'name')
    .populate('categoryId', 'name')
    .populate('product_id', 'name')
    .populate(
      'queryId',
      'queryCode query_tracking_code status companyInfo branchId'
    )
    .populate('images', 'name path mimetype')
    .populate('rates.submittedBy', 'name email')
    .lean()

export const findQueryProductByIdSelectRawProductCode = (filter) =>
  QueryProductModel.findOne(filter).select('rawProductCode').lean()

export const findByIdAndUpdateQueryProductQueryCode = (id, queryCode) =>
  QueryProductModel.findByIdAndUpdate(id, {
    $set: { queryCode },
  })

export const findByIdAndUpdateQueryProductHodApproved = (id) =>
  QueryProductModel.findByIdAndUpdate(id, {
    $set: { hodApproved: true },
  })

export const findByIdAndUpdateQueryProductRates = (id, update) =>
  QueryProductModel.findByIdAndUpdate(id, update)

export const findOneAndUpdateQueryProduct = (filter, update, options) =>
  QueryProductModel.findOneAndUpdate(filter, update, options)
    .populate('groupId', 'name _id')
    .populate('categoryId', 'name _id')
    .populate('images', 'name path mimetype _id')
    .lean()

const queryProductRepository = {
  find: (filter) => QueryProductModel.find(filter),
  findOne: (filter) => QueryProductModel.findOne(filter),
  findById: (id) => QueryProductModel.findById(id),
  findByIdAndUpdate: (id, update, options) =>
    QueryProductModel.findByIdAndUpdate(id, update, options),
}

export default queryProductRepository
