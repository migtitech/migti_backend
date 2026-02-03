import { Router } from 'express'
import { asyncHandler } from '../utils/asyncWrapper.js'
import {
  createCompanyController,
  listCompaniesController,
  getCompanyByIdController,
  updateCompanyController,
  deleteCompanyController,
} from '../controller/company/company.controller.js'

const companyRouter = Router()

companyRouter.post('/create', asyncHandler(createCompanyController))
companyRouter.get('/list', asyncHandler(listCompaniesController))
companyRouter.get('/get-by-id', asyncHandler(getCompanyByIdController))
companyRouter.put('/update', asyncHandler(updateCompanyController))
companyRouter.delete('/delete', asyncHandler(deleteCompanyController))

export default companyRouter
