import PurchaseOrderModel from '../models/purchaseOrder.model.js'

export {
  PURCHASE_ORDER_STATUS,
  PO_PAYMENT_RECEIVED_STATUS,
} from '../models/purchaseOrder.model.js'

export const countPurchaseOrders = (filter) =>
  PurchaseOrderModel.countDocuments(filter)

export const findOutstandingPurchaseOrders = (filter) =>
  PurchaseOrderModel.find(filter)
    .select('products freightCharge packingCharge payments status')
    .lean()

export const findPendingPurchaseOrdersForDashboard = (filter) =>
  PurchaseOrderModel.find(filter)
    .sort({ createdAt: -1 })
    .limit(25)
    .select(
      'poCode quotationId companyInfo status createdAt products freightCharge packingCharge payments'
    )
    .lean()

export const distinctPurchaseOrderQuotationIds = (filter) =>
  PurchaseOrderModel.distinct('quotationId', filter)

const purchaseOrderRepository = {
  find: (filter) => PurchaseOrderModel.find(filter),
  findOne: (filter) => PurchaseOrderModel.findOne(filter),
  findById: (id) => PurchaseOrderModel.findById(id),
  findByIdAndUpdate: (id, update, options) =>
    PurchaseOrderModel.findByIdAndUpdate(id, update, options),
  create: (data) => PurchaseOrderModel.create(data),
  countDocuments: (filter) => PurchaseOrderModel.countDocuments(filter),
  distinct: (field, filter) => PurchaseOrderModel.distinct(field, filter),
}

export default purchaseOrderRepository
