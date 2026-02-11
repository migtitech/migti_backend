import { Router } from 'express'
import { asyncHandler } from '../utils/asyncWrapper.js'
import {
  upsertRateController,
  getByProductController,
  getBySupplierController,
  deleteRateCardController,
  searchProductsController,
  searchSuppliersController,
} from '../controller/rateCard/rateCard.controller.js'

const rateCardRouter = Router()

rateCardRouter.post('/upsert-rate', asyncHandler(upsertRateController))
rateCardRouter.get('/by-product', asyncHandler(getByProductController))
rateCardRouter.get('/by-supplier', asyncHandler(getBySupplierController))
rateCardRouter.delete('/delete', asyncHandler(deleteRateCardController))
rateCardRouter.get('/search-products', asyncHandler(searchProductsController))
rateCardRouter.get('/search-suppliers', asyncHandler(searchSuppliersController))

export default rateCardRouter
