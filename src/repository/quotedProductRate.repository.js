import QuotedProductRateModel from '../models/quotedProductRate.model.js'

export const bulkWriteQuotedProductRates = (ops, options) =>
  QuotedProductRateModel.bulkWrite(ops, options)
