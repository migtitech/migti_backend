import { Router } from 'express'
import { asyncHandler } from '../utils/asyncWrapper.js'
import { authenticateToken, checkPermission } from '../middlewares/jwtAuth.js'
import { MODULES } from '../core/common/constant.js'
import {
  listPurchaseOrdersController,
  getPurchaseOrderByIdController,
  listPoProductLinesController,
  getPurchaseOrderByQuotationIdController,
  createPurchaseOrderFromQuotationController,
  updatePurchaseOrderController,
  updatePurchaseOrderStatusController,
  appendPurchaseOrderPaymentController,
} from '../controller/purchaseOrder/purchaseOrder.controller.js'

const purchaseOrderRouter = Router()

purchaseOrderRouter.get(
  '/list',
  authenticateToken,
  checkPermission(MODULES.PURCHASE_ORDERS, 'read'),
  asyncHandler(listPurchaseOrdersController)
)
purchaseOrderRouter.get(
  '/get-by-id',
  authenticateToken,
  checkPermission(MODULES.PURCHASE_ORDERS, 'read'),
  asyncHandler(getPurchaseOrderByIdController)
)
purchaseOrderRouter.get(
  '/po-product-lines',
  authenticateToken,
  checkPermission(MODULES.PURCHASE_ORDERS, 'read'),
  asyncHandler(listPoProductLinesController)
)
purchaseOrderRouter.get(
  '/by-quotation',
  authenticateToken,
  checkPermission(MODULES.PURCHASE_ORDERS, 'read'),
  asyncHandler(getPurchaseOrderByQuotationIdController)
)
purchaseOrderRouter.post(
  '/create-from-quotation',
  authenticateToken,
  checkPermission(MODULES.PURCHASE_ORDERS, 'create'),
  asyncHandler(createPurchaseOrderFromQuotationController)
)
purchaseOrderRouter.put(
  '/update',
  authenticateToken,
  checkPermission(MODULES.PURCHASE_ORDERS, 'update'),
  asyncHandler(updatePurchaseOrderController)
)
purchaseOrderRouter.put(
  '/update-status',
  authenticateToken,
  checkPermission(MODULES.PURCHASE_ORDERS, 'update'),
  asyncHandler(updatePurchaseOrderStatusController)
)
purchaseOrderRouter.post(
  '/append-payment',
  authenticateToken,
  checkPermission(MODULES.PURCHASE_ORDERS, 'update'),
  asyncHandler(appendPurchaseOrderPaymentController)
)

export default purchaseOrderRouter
