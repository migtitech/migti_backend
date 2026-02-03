import { Router } from 'express'
import { asyncHandler } from '../../utils/asyncWrapper.js'
import {
  loginAdmin,
  loginSuperAdmin,
  createAdmin,
  listAdmin,
  updateAdmin,
  deleteAdminController,
  updateAdminAccessController,
  getAdminByIdController,
} from '../../controller/admin/admin.controller.js'
// import { authenticateToken, requireAdmin } from '../../middlewares/jwtAuth.js'

const adminRouter = Router()

adminRouter.post('/login', asyncHandler(loginAdmin))
adminRouter.post('/superadmin/login', asyncHandler(loginSuperAdmin))
adminRouter.post('/create', asyncHandler(createAdmin))
adminRouter.get('/list', asyncHandler(listAdmin))
adminRouter.get('/get-by-id', asyncHandler(getAdminByIdController))
adminRouter.put('/update', asyncHandler(updateAdmin))
adminRouter.put('/update-access', asyncHandler(updateAdminAccessController))
adminRouter.delete('/delete', asyncHandler(deleteAdminController))



export default adminRouter
