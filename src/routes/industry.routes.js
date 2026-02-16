import { Router } from 'express'
import { asyncHandler } from '../utils/asyncWrapper.js'
import { authenticateToken, checkPermission } from '../middlewares/jwtAuth.js'
import { MODULES } from '../core/common/constant.js'
import {
  createIndustryController,
  listIndustriesController,
  getIndustryByIdController,
  updateIndustryController,
  deleteIndustryController,
} from '../controller/industry/industry.controller.js'

const industryRouter = Router()

industryRouter.post('/create', authenticateToken, checkPermission(MODULES.INDUSTRIES, 'create'), asyncHandler(createIndustryController))
industryRouter.get('/list', authenticateToken, checkPermission(MODULES.INDUSTRIES, 'read'), asyncHandler(listIndustriesController))
industryRouter.get('/get-by-id', authenticateToken, checkPermission(MODULES.INDUSTRIES, 'read'), asyncHandler(getIndustryByIdController))
industryRouter.put('/update', authenticateToken, checkPermission(MODULES.INDUSTRIES, 'update'), asyncHandler(updateIndustryController))
industryRouter.delete('/delete', authenticateToken, checkPermission(MODULES.INDUSTRIES, 'delete'), asyncHandler(deleteIndustryController))

export default industryRouter
