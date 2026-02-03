import express from 'express'
import adminRouter from './admin.routes.js'
import roleRouter from './role.routes.js'

const adminIndexRouter = express.Router()

adminIndexRouter.use('/admin', adminRouter)
adminIndexRouter.use('/admin/role', roleRouter)

export default adminIndexRouter
