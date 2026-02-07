import { Router } from 'express'
import { asyncHandler } from '../utils/asyncWrapper.js'
import { upload } from '../middlewares/uploads.js'
import {
  createProductController, 
  listProductsController,
  getProductByIdController,
  updateProductController,
  deleteProductController,
  uploadProductImagesController,
} from '../controller/product/product.controller.js'

const productRouter = Router()

productRouter.post('/create', asyncHandler(createProductController))
productRouter.get('/list', asyncHandler(listProductsController))
productRouter.get('/get-by-id', asyncHandler(getProductByIdController))
productRouter.put('/update', asyncHandler(updateProductController))
productRouter.delete('/delete', asyncHandler(deleteProductController))
productRouter.post('/upload-images', upload.array('images', 10), asyncHandler(uploadProductImagesController))

export default productRouter
