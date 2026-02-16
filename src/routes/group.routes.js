import { Router } from 'express'
import { asyncHandler } from '../utils/asyncWrapper.js'
import {
  createGroupController,
  listGroupsController,
  getGroupByIdController,
  updateGroupController,
  deleteGroupController,
} from '../controller/group/group.controller.js'

const groupRouter = Router()

groupRouter.post('/create', asyncHandler(createGroupController))
groupRouter.get('/list', asyncHandler(listGroupsController))
groupRouter.get('/get-by-id', asyncHandler(getGroupByIdController))
groupRouter.put('/update', asyncHandler(updateGroupController))
groupRouter.delete('/delete', asyncHandler(deleteGroupController))

export default groupRouter
