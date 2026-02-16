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
import { authenticateToken } from '../../middlewares/jwtAuth.js'
import { MODULE_LIST, ACTIONS } from '../../core/common/constant.js'

const adminRouter = Router()

adminRouter.post('/login', asyncHandler(loginAdmin))
adminRouter.post('/superadmin/login', asyncHandler(loginSuperAdmin))
adminRouter.post('/create', authenticateToken, asyncHandler(createAdmin))
adminRouter.get('/list', authenticateToken, asyncHandler(listAdmin))
adminRouter.get('/get-by-id', authenticateToken, asyncHandler(getAdminByIdController))
adminRouter.put('/update', authenticateToken, asyncHandler(updateAdmin))
adminRouter.put('/update-access', authenticateToken, asyncHandler(updateAdminAccessController))
adminRouter.delete('/delete', authenticateToken, asyncHandler(deleteAdminController))

// RBAC: Get all available modules and actions for the permissions UI
adminRouter.get('/permissions/modules', authenticateToken, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Modules retrieved successfully',
    data: {
      modules: MODULE_LIST,
      actions: Object.values(ACTIONS),
    },
  })
})

export default adminRouter
