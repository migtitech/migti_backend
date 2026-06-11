import PoProductModel from '../models/poProduct.model.js'

export {
  PO_PRODUCT_PROCUREMENT_STATUS,
  PO_PRODUCT_INVENTORY_STATUS,
  resolvePoProductLineStatus,
} from '../models/poProduct.model.js'

const poProductRepository = {
  find: (filter) => PoProductModel.find(filter),
  findOne: (filter) => PoProductModel.findOne(filter),
  findById: (id) => PoProductModel.findById(id),
  findByIdAndUpdate: (id, update, options) =>
    PoProductModel.findByIdAndUpdate(id, update, options),
  findOneAndUpdate: (filter, update, options) =>
    PoProductModel.findOneAndUpdate(filter, update, options),
  create: (data) => PoProductModel.create(data),
  new: (data) => new PoProductModel(data),
  insertMany: (docs) => PoProductModel.insertMany(docs),
  deleteMany: (filter) => PoProductModel.deleteMany(filter),
  updateMany: (filter, update, options) =>
    PoProductModel.updateMany(filter, update, options),
  updateOne: (filter, update, options) =>
    PoProductModel.updateOne(filter, update, options),
  aggregate: (pipeline) => PoProductModel.aggregate(pipeline),
}

export default poProductRepository
