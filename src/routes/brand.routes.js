import { Router } from 'express'
import { asyncHandler } from '../utils/asyncWrapper.js'
import {
  createBrandController,
  listBrandsController,
  getBrandByIdController,
  updateBrandController,
  deleteBrandController,
} from '../controller/brand/brand.controller.js'

const brandRouter = Router()

brandRouter.post('/create', asyncHandler(createBrandController))
brandRouter.get('/list', asyncHandler(listBrandsController))
brandRouter.get('/get-by-id', asyncHandler(getBrandByIdController))
brandRouter.put('/update', asyncHandler(updateBrandController))
brandRouter.delete('/delete', asyncHandler(deleteBrandController))

export default brandRouter
