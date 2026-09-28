import { Router } from 'express'
import { getSavedTutors, saveTutor, unsaveTutor } from '../controllers/savedTutorController.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
const router=Router()
router.use(requireAuth,requireRole('STUDENT'))
router.get('/',getSavedTutors)
router.post('/:tutorId',saveTutor)
router.delete('/:tutorId',unsaveTutor)
export default router
