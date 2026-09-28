import { Router } from 'express'
import { studentDashboard, tutorDashboard } from '../controllers/dashboardController.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
const router=Router()
router.get('/student/dashboard',requireAuth,requireRole('STUDENT'),studentDashboard)
router.get('/tutor/dashboard',requireAuth,requireRole('TUTOR'),tutorDashboard)
export default router
