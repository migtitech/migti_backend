import { Router } from 'express'
import { asyncHandler } from '../../utils/asyncWrapper.js'
import {
  createRoleController,
  listRolesController,
  getRoleByIdController,
  updateRoleController,
  deleteRoleController,
} from '../../controller/admin/role.controller.js'

const roleRouter = Router()

roleRouter.post('/create', asyncHandler(createRoleController))
roleRouter.get('/list', asyncHandler(listRolesController))
roleRouter.get('/get-by-id', asyncHandler(getRoleByIdController))
roleRouter.put('/update', asyncHandler(updateRoleController))
roleRouter.delete('/delete', asyncHandler(deleteRoleController))

export default roleRouter
