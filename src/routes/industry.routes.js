import { Router } from 'express'
import { asyncHandler } from '../utils/asyncWrapper.js'
import {
  createIndustryController,
  listIndustriesController,
  getIndustryByIdController,
  updateIndustryController,
  deleteIndustryController,
} from '../controller/industry/industry.controller.js'

const industryRouter = Router()

industryRouter.post('/create', asyncHandler(createIndustryController))
industryRouter.get('/list', asyncHandler(listIndustriesController))
industryRouter.get('/get-by-id', asyncHandler(getIndustryByIdController))
industryRouter.put('/update', asyncHandler(updateIndustryController))
industryRouter.delete('/delete', asyncHandler(deleteIndustryController))

export default industryRouter
