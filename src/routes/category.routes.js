import { Router } from 'express'
import { asyncHandler } from '../utils/asyncWrapper.js'
import { authenticateToken, checkPermission } from '../middlewares/jwtAuth.js'
import { MODULES } from '../core/common/constant.js'
import {
  createCategoryController,
  listCategoriesController,
  getCategoryByIdController,
  updateCategoryController,
  deleteCategoryController,
} from '../controller/category/category.controller.js'

const categoryRouter = Router()

categoryRouter.post('/create', authenticateToken, checkPermission(MODULES.CATEGORIES, 'create'), asyncHandler(createCategoryController))
categoryRouter.get('/list', authenticateToken, checkPermission(MODULES.CATEGORIES, 'read'), asyncHandler(listCategoriesController))
categoryRouter.get('/get-by-id', authenticateToken, checkPermission(MODULES.CATEGORIES, 'read'), asyncHandler(getCategoryByIdController))
categoryRouter.put('/update', authenticateToken, checkPermission(MODULES.CATEGORIES, 'update'), asyncHandler(updateCategoryController))
categoryRouter.delete('/delete', authenticateToken, checkPermission(MODULES.CATEGORIES, 'delete'), asyncHandler(deleteCategoryController))

export default categoryRouter
