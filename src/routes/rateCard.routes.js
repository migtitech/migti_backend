import { Router } from 'express'
import { asyncHandler } from '../utils/asyncWrapper.js'
import { authenticateToken, checkPermission } from '../middlewares/jwtAuth.js'
import { MODULES } from '../core/common/constant.js'
import {
  upsertRateController,
  getByProductController,
  getBySupplierController,
  deleteRateCardController,
  searchProductsController,
  searchSuppliersController,
} from '../controller/rateCard/rateCard.controller.js'

const rateCardRouter = Router()

rateCardRouter.post('/upsert-rate', authenticateToken, checkPermission(MODULES.RATE_CARDS, 'create'), asyncHandler(upsertRateController))
rateCardRouter.get('/by-product', authenticateToken, checkPermission(MODULES.RATE_CARDS, 'read'), asyncHandler(getByProductController))
rateCardRouter.get('/by-supplier', authenticateToken, checkPermission(MODULES.RATE_CARDS, 'read'), asyncHandler(getBySupplierController))
rateCardRouter.delete('/delete', authenticateToken, checkPermission(MODULES.RATE_CARDS, 'delete'), asyncHandler(deleteRateCardController))
rateCardRouter.get('/search-products', authenticateToken, checkPermission(MODULES.RATE_CARDS, 'read'), asyncHandler(searchProductsController))
rateCardRouter.get('/search-suppliers', authenticateToken, checkPermission(MODULES.RATE_CARDS, 'read'), asyncHandler(searchSuppliersController))

export default rateCardRouter
