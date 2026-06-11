import PurchaseBillingRequestModel from '../models/purchaseBillingRequest.model.js'

export { PURCHASE_BILLING_REQUEST_STATUS } from '../models/purchaseBillingRequest.model.js'

const purchaseBillingRequestRepository = {
  find: (filter) => PurchaseBillingRequestModel.find(filter),
  findOne: (filter) => PurchaseBillingRequestModel.findOne(filter),
  findByIdAndUpdate: (id, update, options) =>
    PurchaseBillingRequestModel.findByIdAndUpdate(id, update, options),
  findByIdAndDelete: (id) => PurchaseBillingRequestModel.findByIdAndDelete(id),
  findOneAndUpdate: (filter, update, options) =>
    PurchaseBillingRequestModel.findOneAndUpdate(filter, update, options),
  create: (data) => PurchaseBillingRequestModel.create(data),
  countDocuments: (filter) =>
    PurchaseBillingRequestModel.countDocuments(filter),
}

export default purchaseBillingRequestRepository
