import PoPaymentBacklogModel from '../models/poPaymentBacklog.model.js'

const poPaymentBacklogRepository = {
  find: (filter) => PoPaymentBacklogModel.find(filter),
  findOne: (filter) => PoPaymentBacklogModel.findOne(filter),
  create: (data) => PoPaymentBacklogModel.create(data),
  countDocuments: (filter) => PoPaymentBacklogModel.countDocuments(filter),
  aggregate: (pipeline) => PoPaymentBacklogModel.aggregate(pipeline),
}

export default poPaymentBacklogRepository
