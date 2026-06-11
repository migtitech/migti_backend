import ProductlHodRatesModel, {
  PRODUCTL_HOD_RATE_STATUS,
} from '../models/productlHodRates.model.js'

export { PRODUCTL_HOD_RATE_STATUS }

export const resetApprovedProductlHodRatesToPending = () =>
  ProductlHodRatesModel.updateMany(
    {
      status: PRODUCTL_HOD_RATE_STATUS.HOD_APPROVED,
      isDeleted: false,
    },
    {
      $set: { status: PRODUCTL_HOD_RATE_STATUS.HOD_APPROVAL_PENDING },
    }
  )

export const distinctApprovedProCodes = (proCodes) =>
  ProductlHodRatesModel.distinct('pro_code', {
    pro_code: { $in: proCodes },
    status: PRODUCTL_HOD_RATE_STATUS.HOD_APPROVED,
    isDeleted: false,
  })

export const findProductlHodRatesByProCode = (proCode) =>
  ProductlHodRatesModel.find({
    pro_code: proCode,
    isDeleted: false,
  })
    .sort({ createdAt: -1 })
    .lean()

export const updateManyPendingProductlHodRates = (filter, update) =>
  ProductlHodRatesModel.updateMany(filter, update)

export const updateManyApprovedProductlHodRates = (filter, update) =>
  ProductlHodRatesModel.updateMany(filter, update)

export const createProductlHodRate = (data) => ProductlHodRatesModel.create(data)

export const insertManyProductlHodRates = (docs) =>
  ProductlHodRatesModel.insertMany(docs)

const productlHodRatesRepository = {
  find: (filter) => ProductlHodRatesModel.find(filter),
  findOne: (filter) => ProductlHodRatesModel.findOne(filter),
}

export default productlHodRatesRepository
