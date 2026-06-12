import { Router } from 'express'
import { asyncHandler } from '../utils/asyncWrapper.js'
import { authenticateToken } from '../middlewares/jwtAuth.js'
import { uploadCatalogMemory } from '../middlewares/uploads.js'
import {
  createCompanyDocumentController,
  listCompanyDocumentsController,
  deleteCompanyDocumentController,
} from '../controller/companyDocument/companyDocument.controller.js'

const companyDocumentRouter = Router()

companyDocumentRouter.post(
  '/create',
  authenticateToken,
  uploadCatalogMemory.single('catalog'),
  asyncHandler(createCompanyDocumentController)
)

companyDocumentRouter.get(
  '/list',
  authenticateToken,
  asyncHandler(listCompanyDocumentsController)
)

companyDocumentRouter.delete(
  '/delete',
  authenticateToken,
  asyncHandler(deleteCompanyDocumentController)
)

export default companyDocumentRouter
