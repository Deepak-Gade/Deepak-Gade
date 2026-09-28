import { Router } from 'express'
import { createDemoRequest, getDemoRequest, getStudentDemoRequests, getTutorDemoRequests, updateDemoStatus } from '../controllers/demoRequestController.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { demoRequestSchema, statusSchema } from '../utils/validators.js'
const router=Router()
router.use(requireAuth)
router.post('/',requireRole('STUDENT'),validate(demoRequestSchema),createDemoRequest)
router.get('/student',requireRole('STUDENT'),getStudentDemoRequests)
router.get('/tutor',requireRole('TUTOR'),getTutorDemoRequests)
router.get('/:id',getDemoRequest)
router.patch('/:id/status',validate(statusSchema),updateDemoStatus)
export default router
