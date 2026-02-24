import { Router } from 'express'
import { asyncHandler } from '../utils/asyncWrapper.js'
import { authenticateToken, checkPermission, checkPermissionAny } from '../middlewares/jwtAuth.js'
import { MODULES } from '../core/common/constant.js'
import { uploadCatalogMemory } from '../middlewares/uploads.js'
import { handleMulterError } from '../middlewares/s3Upload.js'
import {
  createSupplierController,
  listSuppliersController,
  searchSuppliersController,
  getSupplierByIdController,
  updateSupplierController,
  deleteSupplierController,
  uploadSupplierCatalogController,
} from '../controller/supplier/supplier.controller.js'

const supplierRouter = Router()

supplierRouter.post('/create', authenticateToken, checkPermission(MODULES.SUPPLIERS, 'create'), asyncHandler(createSupplierController))
supplierRouter.get('/list', authenticateToken, checkPermission(MODULES.SUPPLIERS, 'read'), asyncHandler(listSuppliersController))
supplierRouter.get('/search', authenticateToken, checkPermission(MODULES.SUPPLIERS, 'read'), asyncHandler(searchSuppliersController))
supplierRouter.get('/get-by-id', authenticateToken, checkPermission(MODULES.SUPPLIERS, 'read'), asyncHandler(getSupplierByIdController))
supplierRouter.put('/update', authenticateToken, checkPermission(MODULES.SUPPLIERS, 'update'), asyncHandler(updateSupplierController))
supplierRouter.delete('/delete', authenticateToken, checkPermission(MODULES.SUPPLIERS, 'delete'), asyncHandler(deleteSupplierController))
supplierRouter.post(
  '/upload-catalog',
  authenticateToken,
  checkPermissionAny(MODULES.SUPPLIERS, ['create', 'update']),
  uploadCatalogMemory.single('catalog'),
  handleMulterError,
  asyncHandler(uploadSupplierCatalogController),
)

export default supplierRouter
