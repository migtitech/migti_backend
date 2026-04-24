import { Router } from 'express'
import { asyncHandler } from '../utils/asyncWrapper.js'
import { authenticateToken, checkPermission } from '../middlewares/jwtAuth.js'
import { MODULES } from '../core/common/constant.js'
import {
  createQueryNewProductController,
  listQueryNewProductsController,
  getQueryNewProductByIdController,
  deleteQueryNewProductController,
} from '../controller/queryNewProduct/queryNewProduct.controller.js'

const queryNewProductRouter = Router()

queryNewProductRouter.post(
  '/create',
  authenticateToken,
  checkPermission(MODULES.PRODUCTS, 'create'),
  asyncHandler(createQueryNewProductController)
)

queryNewProductRouter.get(
  '/list',
  authenticateToken,
  checkPermission(MODULES.PRODUCTS, 'read'),
  asyncHandler(listQueryNewProductsController)
)

queryNewProductRouter.get(
  '/get-by-id',
  authenticateToken,
  checkPermission(MODULES.PRODUCTS, 'read'),
  asyncHandler(getQueryNewProductByIdController)
)

queryNewProductRouter.delete(
  '/delete',
  authenticateToken,
  checkPermission(MODULES.PRODUCTS, 'delete'),
  asyncHandler(deleteQueryNewProductController)
)

export default queryNewProductRouter
