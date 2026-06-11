import LocalPurchaseModel from '../models/localPurchase.model.js'

export { LOCAL_PURCHASE_STATUS } from '../models/localPurchase.model.js'

const localPurchaseRepository = {
  find: (filter) => LocalPurchaseModel.find(filter),
  findOne: (filter) => LocalPurchaseModel.findOne(filter),
  findById: (id) => LocalPurchaseModel.findById(id),
  findOneAndUpdate: (filter, update, options) =>
    LocalPurchaseModel.findOneAndUpdate(filter, update, options),
  create: (data) => LocalPurchaseModel.create(data),
  countDocuments: (filter) => LocalPurchaseModel.countDocuments(filter),
}

export default localPurchaseRepository
