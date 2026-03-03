import { Router } from 'express'
import { asyncHandler } from '../utils/asyncWrapper.js'
import { authenticateToken } from '../middlewares/jwtAuth.js'
import { uploadDocumentsController, serveDocumentController } from '../controller/document/document.controller.js'
import { uploadAssetsMemory } from '../middlewares/uploads.js'

const documentRouter = Router()

documentRouter.post(
  '/upload',
  authenticateToken,
  uploadAssetsMemory.array('images', 20),
  asyncHandler(uploadDocumentsController),
)

documentRouter.get('/serve/:id', authenticateToken, asyncHandler(serveDocumentController))

export default documentRouter
