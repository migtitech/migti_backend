import { Router } from 'express'
import { asyncHandler } from '../utils/asyncWrapper.js'
import {
  createCompanyBranchController,
  listCompanyBranchesController,
  getCompanyBranchByIdController,
  updateCompanyBranchController,
  deleteCompanyBranchController,
} from '../controller/companyBranch/companyBranch.controller.js'

const companyBranchRouter = Router()

companyBranchRouter.post('/create', asyncHandler(createCompanyBranchController))
companyBranchRouter.get('/list', asyncHandler(listCompanyBranchesController))
companyBranchRouter.get(
  '/get-by-id',
  asyncHandler(getCompanyBranchByIdController)
)
companyBranchRouter.put('/update', asyncHandler(updateCompanyBranchController))
companyBranchRouter.delete(
  '/delete',
  asyncHandler(deleteCompanyBranchController)
)

export default companyBranchRouter
