import PurchaseTaskModel from '../models/purchaseTask.model.js'

export {
  PURCHASE_TASK_STATUS,
  PURCHASE_TASK_TYPE,
  PURCHASE_TASK_PRIORITY,
} from '../models/purchaseTask.model.js'

const purchaseTaskRepository = {
  find: (filter) => PurchaseTaskModel.find(filter),
  findOne: (filter) => PurchaseTaskModel.findOne(filter),
  findByIdAndUpdate: (id, update, options) =>
    PurchaseTaskModel.findByIdAndUpdate(id, update, options),
  create: (data) => PurchaseTaskModel.create(data),
  insertMany: (docs) => PurchaseTaskModel.insertMany(docs),
  countDocuments: (filter) => PurchaseTaskModel.countDocuments(filter),
}

export default purchaseTaskRepository
