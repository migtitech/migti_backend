import { Router } from 'express'
import { asyncHandler } from '../utils/asyncWrapper.js'
import { authenticateToken } from '../middlewares/jwtAuth.js'
import {
  listProBucketQueryProductsController,
  getProBucketQueryProductByIdController,
  appendProBucketRatesController,
  updateQueryProductController,
} from '../controller/proBucket/proBucket.controller.js'

const proBucketRouter = Router()

proBucketRouter.get(
  '/query-products',
  authenticateToken,
  asyncHandler(listProBucketQueryProductsController)
)
proBucketRouter.get(
  '/query-products/:id',
  authenticateToken,
  asyncHandler(getProBucketQueryProductByIdController)
)
proBucketRouter.put(
  '/query-products/:id',
  authenticateToken,
  asyncHandler(updateQueryProductController)
)
proBucketRouter.post(
  '/query-products/:id/rates',
  authenticateToken,
  asyncHandler(appendProBucketRatesController)
)

export default proBucketRouter
