import express from 'express'
import adminIndexRouter from './admin/index.js'
import companyRouter from './company.routes.js'
import companyBranchRouter from './companyBranch.routes.js'
import employeeRouter from './employee.routes.js'
import rawQueryRouter from './rawQuery.routes.js'
import categoryRouter from './category.routes.js'
import brandRouter from './brand.routes.js'
import productRouter from './product.routes.js'
import imageRouter from './image.routes.js'
import supplierRouter from './supplier.routes.js'
import rateCardRouter from './rateCard.routes.js'
import areaRouter from './area.routes.js'
import industryRouter from './industry.routes.js'
import queryRouter from './query.routes.js'

const mainRoutes = express.Router()
mainRoutes.use((req, res, next) => {
  console.log(`Main Routes - ${req.method} ${req.originalUrl}`)
  next()
})

mainRoutes.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'API is working',
    data: {
      timestamp: new Date().toISOString(),
      routes: ['/v1/admin', '/v1/companies', '/v1/company-branches', '/v1/employees', '/v1/raw-queries']
    }
  })
})

mainRoutes.use('/v1', adminIndexRouter)
mainRoutes.use('/v1/companies', companyRouter)
mainRoutes.use('/v1/company-branches', companyBranchRouter)
mainRoutes.use('/v1/employees', employeeRouter)
mainRoutes.use('/v1/raw-queries', rawQueryRouter)
mainRoutes.use('/v1/categories', categoryRouter)
mainRoutes.use('/v1/brands', brandRouter)
mainRoutes.use('/v1/products', productRouter)
mainRoutes.use('/v1/images', imageRouter)
mainRoutes.use('/v1/suppliers', supplierRouter)
mainRoutes.use('/v1/rate-cards', rateCardRouter)
mainRoutes.use('/v1/areas', areaRouter)
mainRoutes.use('/v1/industries', industryRouter)
mainRoutes.use('/v1/queries', queryRouter)

export default mainRoutes
