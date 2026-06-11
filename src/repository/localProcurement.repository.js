import LocalProcurementModel from '../models/localProcurement.model.js'

export { LOCAL_PROCUREMENT_STATUS } from '../models/localProcurement.model.js'

const localProcurementRepository = {
  find: (filter) => LocalProcurementModel.find(filter),
  findOne: (filter) => LocalProcurementModel.findOne(filter),
  findById: (id) => LocalProcurementModel.findById(id),
  findOneAndUpdate: (filter, update, options) =>
    LocalProcurementModel.findOneAndUpdate(filter, update, options),
  create: (data) => LocalProcurementModel.create(data),
  countDocuments: (filter) => LocalProcurementModel.countDocuments(filter),
}

export default localProcurementRepository
