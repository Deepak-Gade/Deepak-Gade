import { Router } from 'express'
import { createRequirement, getMyRequirements, getRequirement, updateRequirement } from '../controllers/requirementController.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { requirementSchema } from '../utils/validators.js'
const router=Router()
router.use(requireAuth,requireRole('STUDENT','ADMIN'))
router.post('/',validate(requirementSchema),createRequirement)
router.get('/me',getMyRequirements)
router.get('/:id',getRequirement)
router.put('/:id',validate(requirementSchema),updateRequirement)
export default router
