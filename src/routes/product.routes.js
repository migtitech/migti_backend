import { Router } from 'express'
import { asyncHandler } from '../utils/asyncWrapper.js'
import { authenticateToken, checkPermission } from '../middlewares/jwtAuth.js'
import { MODULES } from '../core/common/constant.js'
import { uploadAssetsMemory } from '../middlewares/uploads.js'
import {
  createProductController,
  listProductsController,
  getProductByIdController,
  updateProductController,
  deleteProductController,
  uploadProductImagesController,
} from '../controller/product/product.controller.js'

const productRouter = Router()

productRouter.post('/create', authenticateToken, checkPermission(MODULES.PRODUCTS, 'create'), asyncHandler(createProductController))
productRouter.get('/list', authenticateToken, checkPermission(MODULES.PRODUCTS, 'read'), asyncHandler(listProductsController))
productRouter.get('/get-by-id', authenticateToken, checkPermission(MODULES.PRODUCTS, 'read'), asyncHandler(getProductByIdController))
productRouter.put('/update', authenticateToken, checkPermission(MODULES.PRODUCTS, 'update'), asyncHandler(updateProductController))
productRouter.delete('/delete', authenticateToken, checkPermission(MODULES.PRODUCTS, 'delete'), asyncHandler(deleteProductController))
productRouter.post(
  '/upload-images',
  authenticateToken,
  checkPermission(MODULES.PRODUCTS, 'create'),
  uploadAssetsMemory.array('images', 20),
  asyncHandler(uploadProductImagesController),
)

export default productRouter
