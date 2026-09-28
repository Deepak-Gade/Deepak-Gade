import { Router } from 'express'
import { adminDashboard, adminDemoRequestDetail, adminDemoRequests, adminRequirements, adminStudents, adminTutors, adminUpdateDemoStatus, verifyTutor } from '../controllers/adminController.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { adminIdParamsSchema, adminRequirementsQuerySchema, adminSearchQuerySchema, statusSchema, verifySchema } from '../utils/validators.js'
const router=Router()
router.use(requireAuth,requireRole('ADMIN'))
router.get('/dashboard',adminDashboard)
router.get('/tutors',validate(adminSearchQuerySchema,'query'),adminTutors)
router.patch('/tutors/:id/verify',validate(adminIdParamsSchema,'params'),validate(verifySchema),verifyTutor)
router.get('/students',validate(adminSearchQuerySchema,'query'),adminStudents)
router.get('/requirements',validate(adminRequirementsQuerySchema,'query'),adminRequirements)
router.get('/demo-requests',validate(adminSearchQuerySchema,'query'),adminDemoRequests)
router.get('/demo-requests/:id',validate(adminIdParamsSchema,'params'),adminDemoRequestDetail)
router.patch('/demo-requests/:id/status',validate(adminIdParamsSchema,'params'),validate(statusSchema),adminUpdateDemoStatus)
export default router
