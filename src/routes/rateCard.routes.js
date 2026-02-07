import { Router } from 'express'
import { asyncHandler } from '../utils/asyncWrapper.js'
import {
  createRateCardController,
  listRateCardsController,
  searchRateCardsController,
  getRateCardByIdController,
  updateRateCardController,
  deleteRateCardController,
  addSupplierController,
  updateSupplierController,
  deleteSupplierController,
} from '../controller/rateCard/rateCard.controller.js'

const rateCardRouter = Router()

rateCardRouter.post('/create', asyncHandler(createRateCardController))
rateCardRouter.get('/list', asyncHandler(listRateCardsController))
rateCardRouter.get('/search', asyncHandler(searchRateCardsController))
rateCardRouter.get('/get-by-id', asyncHandler(getRateCardByIdController))
rateCardRouter.put('/update', asyncHandler(updateRateCardController))
rateCardRouter.delete('/delete', asyncHandler(deleteRateCardController))
rateCardRouter.post('/add-supplier', asyncHandler(addSupplierController))
rateCardRouter.put('/update-supplier', asyncHandler(updateSupplierController))
rateCardRouter.delete('/delete-supplier', asyncHandler(deleteSupplierController))

export default rateCardRouter
