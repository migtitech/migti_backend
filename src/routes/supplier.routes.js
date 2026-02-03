import { Router } from 'express'
import { asyncHandler } from '../utils/asyncWrapper.js'
import {
  createSupplierController,
  listSuppliersController,
  searchSuppliersController,
  getSupplierByIdController,
  updateSupplierController,
  deleteSupplierController,
} from '../controller/supplier/supplier.controller.js'

const supplierRouter = Router()

supplierRouter.post('/create', asyncHandler(createSupplierController))
supplierRouter.get('/list', asyncHandler(listSuppliersController))
supplierRouter.get('/search', asyncHandler(searchSuppliersController))
supplierRouter.get('/get-by-id', asyncHandler(getSupplierByIdController))
supplierRouter.put('/update', asyncHandler(updateSupplierController))
supplierRouter.delete('/delete', asyncHandler(deleteSupplierController))

export default supplierRouter
