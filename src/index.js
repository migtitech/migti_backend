import http from 'http'
import express from 'express'
import { Server } from 'socket.io'
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
import {
  startTargetAnalyticsCron,
  stopTargetAnalyticsCron,
} from './services/targetAnalytics/targetAnalytics.cron.js'
import {
  startDatabaseBackupCron,
  stopDatabaseBackupCron,
} from './services/databaseBackup/databaseBackup.cron.js'
import { fileURLToPath } from 'url'
import { verifyToken } from './core/helpers/jwt.helper.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 7200
const httpServer = http.createServer(app)

const io = new Server(httpServer, {
  cors: {
    // Reflect request Origin (needed when UI is on :3000 and API/socket on :7200)
    origin: true,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  allowEIO3: true,
})

app.set('io', io)

io.use((socket, next) => {
  try {
    const rawToken =
      socket.handshake.auth?.token ||
      (typeof socket.handshake.headers?.authorization === 'string'
        ? socket.handshake.headers.authorization.replace(/^Bearer\s+/i, '')
        : null)
    if (rawToken) {
      const decoded = verifyToken(rawToken)
      const uid = decoded?.id || decoded?._id
      if (uid) {
        socket.authenticatedUserId = String(uid)
      }
    }
  } catch {
    // Expired/invalid token: client may still emit register (legacy)
  }
  next()
})

io.on('connection', (socket) => {
  if (socket.authenticatedUserId) {
    const room = `user:${socket.authenticatedUserId}`
    socket.join(room)
    logger.info(`Socket joined room (JWT): ${room}`)
  }
  socket.on('register', (payload) => {
    const userId = payload?.userId || payload?.user_id
    if (userId) {
      const room = `user:${String(userId)}`
      socket.join(room)
      logger.info(`Socket joined room: ${room}`)
    }
  })
  socket.on('disconnect', () => {})
})
app.use(express.static(path.join(__dirname, 'public')))
// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is healthy',
    data: {
      status: 'OK',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    },
  })
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

// Routes: mount at /api (full path) and at / (when proxy strips /api)
app.use('/api', mainRoutes)
app.use('/', mainRoutes)

// Global error handler (must be after routes)
app.use((err, req, res, next) => {
  globalExceptionHandler(err, req, res, next)
})

// Database connection
connectDB()

// Ensure assets folders exist at runtime (created dynamically on first upload if missing)
ensureAssetsDir('assets')
ensureAssetsDir('assets/temp')
ensureAssetsDir('backups')

// Initialize Agenda queues
startAgenda().catch((error) => {
  logger.error('Failed to start loyalty points queue:', error)
})

startEmailQueue().catch((error) => {
  logger.error('Failed to start email queue:', error)
})

startTargetAnalyticsCron()
startDatabaseBackupCron()

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully...')
  await stopAgenda()
  await stopEmailQueue()
  await stopTargetAnalyticsCron()
  await stopDatabaseBackupCron()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully...')
  await stopAgenda()
  await stopEmailQueue()
  await stopTargetAnalyticsCron()
  await stopDatabaseBackupCron()
  process.exit(0)
})

httpServer.listen(PORT, '0.0.0.0', () => {
  logger.info(`Server is running at port ${PORT}`)
})
