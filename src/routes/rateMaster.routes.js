import { Router } from 'express'
import { asyncHandler } from '../utils/asyncWrapper.js'
import { authenticateToken, checkPermission } from '../middlewares/jwtAuth.js'
import { MODULES } from '../core/common/constant.js'
import {
  listRatesController,
  summaryController,
  searchCodesController,
} from '../controller/rateMaster/rateMaster.controller.js'

const rateMasterRouter = Router()

rateMasterRouter.get(
  '/search-codes',
  authenticateToken,
  checkPermission(MODULES.RATE_CARDS, 'read'),
  asyncHandler(searchCodesController)
)
rateMasterRouter.get(
  '/summary',
  authenticateToken,
  checkPermission(MODULES.RATE_CARDS, 'read'),
  asyncHandler(summaryController)
)
rateMasterRouter.get(
  '/rates',
  authenticateToken,
  checkPermission(MODULES.RATE_CARDS, 'read'),
  asyncHandler(listRatesController)
)

export default rateMasterRouter
