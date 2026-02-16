import { Router } from 'express'
import { asyncHandler } from '../utils/asyncWrapper.js'
import {
  createIndustryBranchController,
  listIndustryBranchesController,
  getIndustryBranchByIdController,
  updateIndustryBranchController,
  deleteIndustryBranchController,
} from '../controller/industryBranch/industryBranch.controller.js'

const industryBranchRouter = Router()

industryBranchRouter.post('/create', asyncHandler(createIndustryBranchController))
industryBranchRouter.get('/list', asyncHandler(listIndustryBranchesController))
industryBranchRouter.get('/get-by-id', asyncHandler(getIndustryBranchByIdController))
industryBranchRouter.put('/update', asyncHandler(updateIndustryBranchController))
industryBranchRouter.delete('/delete', asyncHandler(deleteIndustryBranchController))

export default industryBranchRouter
