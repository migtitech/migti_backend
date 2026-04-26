import { Router } from 'express'
import { asyncHandler } from '../utils/asyncWrapper.js'
import { authenticateToken, checkPermission } from '../middlewares/jwtAuth.js'
import { MODULES } from '../core/common/constant.js'
import {
  listProBucketQueryProductsController,
  getProBucketQueryProductByIdController,
  appendProBucketRatesController,
} from '../controller/proBucket/proBucket.controller.js'

const proBucketRouter = Router()

proBucketRouter.get(
  '/query-products',
  authenticateToken,
  checkPermission(MODULES.PRO_BUCKET, 'read'),
  asyncHandler(listProBucketQueryProductsController)
)
proBucketRouter.get(
  '/query-products/:id',
  authenticateToken,
  checkPermission(MODULES.PRO_BUCKET, 'read'),
  asyncHandler(getProBucketQueryProductByIdController)
)
proBucketRouter.post(
  '/query-products/:id/rates',
  authenticateToken,
  checkPermission(MODULES.PRO_BUCKET, 'update'),
  asyncHandler(appendProBucketRatesController)
)

export default proBucketRouter
