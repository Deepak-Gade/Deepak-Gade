import { Router } from 'express'
import { getMatches } from '../controllers/requirementController.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
const router=Router()
router.get('/:requirementId',requireAuth,requireRole('STUDENT','ADMIN'),getMatches)
export default router
