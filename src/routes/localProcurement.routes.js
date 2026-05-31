import { Router } from 'express'
import { asyncHandler } from '../utils/asyncWrapper.js'
import { authenticateToken } from '../middlewares/jwtAuth.js'
import {
  assignLocalProcurementController,
  listLocalProcurementsController,
  listLocalProcurementEmployeesController,
  submitLocalProcurementController,
} from '../controller/localProcurement/localProcurement.controller.js'

const localProcurementRouter = Router()

localProcurementRouter.get(
  '/employees',
  authenticateToken,
  asyncHandler(listLocalProcurementEmployeesController)
)

localProcurementRouter.post(
  '/assign',
  authenticateToken,
  asyncHandler(assignLocalProcurementController)
)

localProcurementRouter.get(
  '/',
  authenticateToken,
  asyncHandler(listLocalProcurementsController)
)

localProcurementRouter.put(
  '/:id/submit',
  authenticateToken,
  asyncHandler(submitLocalProcurementController)
)

export default localProcurementRouter
