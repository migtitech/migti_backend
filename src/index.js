import express from 'express'
import corsConfig from './core/config/cors.js'
import globalExceptionHandler from './utils/globalException.js'
import logger from './core/config/logger.js'
import 'dotenv/config'
import path from 'path'
import connectDB from './core/database/connection.js'
import mainRoutes from './routes/routes.js'
import responseInterceptor from './utils/responseInterceptor.js'
import { startAgenda, stopAgenda } from './core/queue/loyaltyPoints.js'
import { startEmailQueue, stopEmailQueue } from './core/queue/emailQueue.js'
import { seedPreferences } from './core/helpers/preferenceData.js'
import { ensureAssetsDir } from './models/document.model.js'
import { fileURLToPath } from 'url'


const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT =  process.env.PORT
app.use(express.static(path.join(__dirname, 'public')));
// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is healthy',
    data: {
      status: 'OK',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }
  });
})


// Middleware
app.use(express.json())
app.use(corsConfig)
app.use(responseInterceptor)
app.use((req, res, next) => {
  logger.info(`Incoming request: ${req.method} ${req.originalUrl}`)
  next()
})

app.use(express.urlencoded({ extended: true }))
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))
app.use('/assets', express.static(path.join(process.cwd(), 'assets')))

// Routes
app.use('/api', mainRoutes)

// Global error handler (must be after routes)
app.use((err, req, res, next) => {
  globalExceptionHandler(err, req, res, next)
})

// Database connection
connectDB()

// Ensure assets folders exist at runtime (created dynamically on first upload if missing)
ensureAssetsDir('assets')
ensureAssetsDir('assets/temp')


// Initialize Agenda queues
startAgenda().catch((error) => {
  logger.error('Failed to start loyalty points queue:', error)
})

startEmailQueue().catch((error) => {
  logger.error('Failed to start email queue:', error)
})

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully...')
  await stopAgenda()
  await stopEmailQueue()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully...')
  await stopAgenda()
  await stopEmailQueue()
  process.exit(0)
})

app.listen(PORT, '0.0.0.0', () => {
  logger.info(`Server is running at port ${PORT}`)
})
