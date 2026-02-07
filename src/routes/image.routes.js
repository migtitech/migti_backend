import { Router } from 'express'
import { asyncHandler } from '../utils/asyncWrapper.js'
import { uploadS3 } from '../middlewares/uploads.js'
import {
  uploadImagesController,
  deleteImageController,
} from '../controller/image/image.controller.js'

const imageRouter = Router()

imageRouter.post(
  '/upload',
  uploadS3.array('images', 10),
  asyncHandler(uploadImagesController)
)

imageRouter.delete('/delete', asyncHandler(deleteImageController))

export default imageRouter
