import BillingRequestModel from '../models/billingRequest.model.js'

export { BILLING_REQUEST_STATUS } from '../models/billingRequest.model.js'

const billingRequestRepository = {
  find: (filter) => BillingRequestModel.find(filter),
  findOne: (filter) => BillingRequestModel.findOne(filter),
  findById: (id) => BillingRequestModel.findById(id),
  findByIdAndUpdate: (id, update, options) =>
    BillingRequestModel.findByIdAndUpdate(id, update, options),
  create: (data) => BillingRequestModel.create(data),
  countDocuments: (filter) => BillingRequestModel.countDocuments(filter),
  generateCode: () => BillingRequestModel.generateCode(),
}

export default billingRequestRepository
