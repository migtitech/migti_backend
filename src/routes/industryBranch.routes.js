import { Router } from 'express'
import { asyncHandler } from '../utils/asyncWrapper.js'
import { authenticateToken, checkPermission } from '../middlewares/jwtAuth.js'
import { MODULES } from '../core/common/constant.js'
import {
  createIndustryBranchController,
  listIndustryBranchesController,
  getIndustryBranchByIdController,
  updateIndustryBranchController,
  deleteIndustryBranchController,
} from '../controller/industryBranch/industryBranch.controller.js'

const industryBranchRouter = Router()

industryBranchRouter.post('/create', authenticateToken, checkPermission(MODULES.INDUSTRY_BRANCHES, 'create'), asyncHandler(createIndustryBranchController))
industryBranchRouter.get('/list', authenticateToken, checkPermission(MODULES.INDUSTRY_BRANCHES, 'read'), asyncHandler(listIndustryBranchesController))
industryBranchRouter.get('/get-by-id', authenticateToken, checkPermission(MODULES.INDUSTRY_BRANCHES, 'read'), asyncHandler(getIndustryBranchByIdController))
industryBranchRouter.put('/update', authenticateToken, checkPermission(MODULES.INDUSTRY_BRANCHES, 'update'), asyncHandler(updateIndustryBranchController))
industryBranchRouter.delete('/delete', authenticateToken, checkPermission(MODULES.INDUSTRY_BRANCHES, 'delete'), asyncHandler(deleteIndustryBranchController))

export default industryBranchRouter
