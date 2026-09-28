import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import authRoutes from './routes/authRoutes.js'
import tutorRoutes from './routes/tutorRoutes.js'
import requirementRoutes from './routes/requirementRoutes.js'
import matchRoutes from './routes/matchRoutes.js'
import demoRequestRoutes from './routes/demoRequestRoutes.js'
import savedTutorRoutes from './routes/savedTutorRoutes.js'
import notificationRoutes from './routes/notificationRoutes.js'
import dashboardRoutes from './routes/dashboardRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import { errorHandler } from './utils/errors.js'
import { notFound } from './middleware/notFound.js'

const app = express()
const configuredOrigins = process.env.CORS_ORIGIN || process.env.CLIENT_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173'
const allowedOrigins = new Set([...configuredOrigins.split(',').map((origin) => origin.trim()).filter(Boolean), process.env.FRONTEND_URL].filter(Boolean))
app.use(cors({ origin: (origin, callback) => callback(null, !origin || allowedOrigins.has(origin)), methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'], allowedHeaders: ['Content-Type','Authorization'] }))
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: false, limit: '1mb' }))

app.get('/api/health', (_req, res) => res.json({ success: true, message: 'TutorLink API is running' }))
app.use('/api/auth', authRoutes)
app.use('/api/tutors', tutorRoutes)
app.use('/api/requirements', requirementRoutes)
app.use('/api/matches', matchRoutes)
app.use('/api/demo-requests', demoRequestRoutes)
app.use('/api/saved-tutors', savedTutorRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api', dashboardRoutes)
app.use('/api/admin', adminRoutes)
app.use(notFound)
app.use(errorHandler)

export default app
