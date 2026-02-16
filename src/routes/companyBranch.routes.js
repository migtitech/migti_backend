import { Router } from 'express'
import { asyncHandler } from '../utils/asyncWrapper.js'
import { authenticateToken, checkPermission } from '../middlewares/jwtAuth.js'
import { MODULES } from '../core/common/constant.js'
import {
  createCompanyBranchController,
  listCompanyBranchesController,
  getCompanyBranchByIdController,
  updateCompanyBranchController,
  deleteCompanyBranchController,
} from '../controller/companyBranch/companyBranch.controller.js'

const companyBranchRouter = Router()

companyBranchRouter.post('/create', authenticateToken, checkPermission(MODULES.BRANCHES, 'create'), asyncHandler(createCompanyBranchController))
companyBranchRouter.get('/list', authenticateToken, checkPermission(MODULES.BRANCHES, 'read'), asyncHandler(listCompanyBranchesController))
companyBranchRouter.get('/get-by-id', authenticateToken, checkPermission(MODULES.BRANCHES, 'read'), asyncHandler(getCompanyBranchByIdController))
companyBranchRouter.put('/update', authenticateToken, checkPermission(MODULES.BRANCHES, 'update'), asyncHandler(updateCompanyBranchController))
companyBranchRouter.delete('/delete', authenticateToken, checkPermission(MODULES.BRANCHES, 'delete'), asyncHandler(deleteCompanyBranchController))

export default companyBranchRouter
