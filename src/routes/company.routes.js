import { Router } from 'express'
import { asyncHandler } from '../utils/asyncWrapper.js'
import { authenticateToken, checkPermission, checkPermissionAny } from '../middlewares/jwtAuth.js'
import { MODULES } from '../core/common/constant.js'
import { uploadAssetsMemory } from '../middlewares/uploads.js'
import {
  createCompanyController,
  listCompaniesController,
  getCompanyByIdController,
  updateCompanyController,
  deleteCompanyController,
  uploadCompanyLogoController,
} from '../controller/company/company.controller.js'

const companyRouter = Router()

companyRouter.post('/create', authenticateToken, checkPermission(MODULES.COMPANIES, 'create'), asyncHandler(createCompanyController))
companyRouter.get('/list', authenticateToken, checkPermission(MODULES.COMPANIES, 'read'), asyncHandler(listCompaniesController))
companyRouter.get('/get-by-id', authenticateToken, checkPermission(MODULES.COMPANIES, 'read'), asyncHandler(getCompanyByIdController))
companyRouter.put('/update', authenticateToken, checkPermission(MODULES.COMPANIES, 'update'), asyncHandler(updateCompanyController))
companyRouter.delete('/delete', authenticateToken, checkPermission(MODULES.COMPANIES, 'delete'), asyncHandler(deleteCompanyController))
companyRouter.post(
  '/upload-logo',
  authenticateToken,
  checkPermissionAny(MODULES.COMPANIES, ['create', 'update']),
  uploadAssetsMemory.single('logo'),
  asyncHandler(uploadCompanyLogoController)
)

export default companyRouter
