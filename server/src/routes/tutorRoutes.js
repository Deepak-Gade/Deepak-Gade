import { Router } from 'express'
import { createMyProfile, getMyProfile, getTutor, listTutors, updateMyProfile } from '../controllers/tutorController.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { tutorProfileSchema } from '../utils/validators.js'
const router=Router()
router.get('/',listTutors)
router.get('/me/profile',requireAuth,requireRole('TUTOR'),getMyProfile)
router.post('/profile',requireAuth,requireRole('TUTOR'),validate(tutorProfileSchema),createMyProfile)
router.put('/profile',requireAuth,requireRole('TUTOR'),validate(tutorProfileSchema),updateMyProfile)
router.get('/:id',getTutor)
export default router
