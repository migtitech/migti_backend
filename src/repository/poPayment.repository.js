import PoPaymentModel from '../models/poPayment.model.js'

const poPaymentRepository = {
  find: (filter) => PoPaymentModel.find(filter),
  findOne: (filter) => PoPaymentModel.findOne(filter),
  findByIdAndUpdate: (id, update, options) =>
    PoPaymentModel.findByIdAndUpdate(id, update, options),
  findOneAndUpdate: (filter, update, options) =>
    PoPaymentModel.findOneAndUpdate(filter, update, options),
  create: (data) => PoPaymentModel.create(data),
}

export default poPaymentRepository
