import { Router } from 'express'
import { asyncHandler } from '../utils/asyncWrapper.js'
import {
  createCategoryController,
  listCategoriesController,
  getCategoryByIdController,
  updateCategoryController,
  deleteCategoryController,
} from '../controller/category/category.controller.js'

const categoryRouter = Router()

categoryRouter.post('/create', asyncHandler(createCategoryController))
categoryRouter.get('/list', asyncHandler(listCategoriesController))
categoryRouter.get('/get-by-id', asyncHandler(getCategoryByIdController))
categoryRouter.put('/update', asyncHandler(updateCategoryController))
categoryRouter.delete('/delete', asyncHandler(deleteCategoryController))

export default categoryRouter
