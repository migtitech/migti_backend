import { Router } from 'express'
import { asyncHandler } from '../utils/asyncWrapper.js'
import { authenticateToken, checkPermission } from '../middlewares/jwtAuth.js'
import { MODULES } from '../core/common/constant.js'
import {
  createBrandController,
  listBrandsController,
  getBrandByIdController,
  updateBrandController,
  deleteBrandController,
} from '../controller/brand/brand.controller.js'

const brandRouter = Router()

brandRouter.post('/create', authenticateToken, checkPermission(MODULES.BRANDS, 'create'), asyncHandler(createBrandController))
brandRouter.get('/list', authenticateToken, checkPermission(MODULES.BRANDS, 'read'), asyncHandler(listBrandsController))
brandRouter.get('/get-by-id', authenticateToken, checkPermission(MODULES.BRANDS, 'read'), asyncHandler(getBrandByIdController))
brandRouter.put('/update', authenticateToken, checkPermission(MODULES.BRANDS, 'update'), asyncHandler(updateBrandController))
brandRouter.delete('/delete', authenticateToken, checkPermission(MODULES.BRANDS, 'delete'), asyncHandler(deleteBrandController))

export default brandRouter
