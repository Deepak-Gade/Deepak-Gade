import { prisma } from '../utils/prisma.js'
import { ApiError, asyncHandler, sendData } from '../utils/errors.js'
import { publicTutor, storeList } from '../utils/values.js'

const tutorInclude = { user: { select: { id: true, name: true, role: true } } }
function profileData(data) {
  return { profilePhoto: data.profilePhoto || null, qualification: data.qualification, experience: data.experience, classes: storeList(data.classes), subjects: storeList(data.subjects), teachingMode: storeList(data.teachingMode), locations: storeList(data.locations), fees: data.fees, availableTimings: storeList(data.availableTimings), about: data.about }
}

export const listTutors = asyncHandler(async (req, res) => {
  for (const field of ['minFee','maxFee','minExperience']) if (req.query[field] !== undefined && (!/^\d+$/.test(String(req.query[field])) || Number(req.query[field]) > 1000000)) throw new ApiError(400, `${field} must be a valid non-negative number.`)
  if (req.query.verified !== undefined && !['true','false'].includes(String(req.query.verified))) throw new ApiError(400, 'verified must be true or false.')
  if (req.query.teachingMode && !['Online','Offline','Both'].includes(req.query.teachingMode)) throw new ApiError(400, 'Teaching mode must be Online, Offline, or Both.')
  if (req.query.minFee && req.query.maxFee && Number(req.query.minFee) > Number(req.query.maxFee)) throw new ApiError(400, 'minFee cannot be greater than maxFee.')
  const where = req.query.verified !== undefined ? { isVerified: req.query.verified === 'true' } : {}
  if (req.query.minFee !== undefined) where.fees = { ...where.fees, gte: Number(req.query.minFee) }
  if (req.query.maxFee !== undefined) where.fees = { ...where.fees, lte: Number(req.query.maxFee) }
  if (req.query.minExperience !== undefined) where.experience = { gte: Number(req.query.minExperience) }
  const profiles = await prisma.tutorProfile.findMany({ where, include: tutorInclude, orderBy: { createdAt: 'desc' } })
  const q = req.query
  const results = profiles.filter((profile) => {
    const classes = JSON.parse(profile.classes || '[]')
    const subjects = JSON.parse(profile.subjects || '[]')
    const modes = JSON.parse(profile.teachingMode || '[]')
    const locations = JSON.parse(profile.locations || '[]')
    if (q.class && !classes.some((value) => value.toLowerCase() === String(q.class).toLowerCase())) return false
    if (q.subject && !subjects.some((value) => value.toLowerCase() === String(q.subject).toLowerCase())) return false
    if (q.location && !locations.some((value) => value.toLowerCase().includes(String(q.location).toLowerCase()))) return false
    if (q.teachingMode && !modes.includes(q.teachingMode) && !modes.includes('Both')) return false
    if (q.minFee !== undefined && profile.fees < Number(q.minFee)) return false
    if (q.maxFee !== undefined && profile.fees > Number(q.maxFee)) return false
    if (q.minExperience !== undefined && profile.experience < Number(q.minExperience)) return false
    return true
  })
  sendData(res, results.map((profile) => publicTutor(profile)))
})

export const getTutor = asyncHandler(async (req, res) => {
  const profile = await prisma.tutorProfile.findFirst({ where: { OR: [{ id: req.params.id }, { userId: req.params.id }] }, include: tutorInclude })
  if (!profile) throw new ApiError(404, 'Tutor profile not found.')
  sendData(res, publicTutor(profile))
})

export const getMyProfile = asyncHandler(async (req, res) => {
  const profile = await prisma.tutorProfile.findUnique({ where: { userId: req.user.id }, include: tutorInclude })
  sendData(res, profile ? publicTutor(profile) : null)
})

export const createMyProfile = asyncHandler(async (req, res) => {
  const existing = await prisma.tutorProfile.findUnique({ where: { userId: req.user.id } })
  if (existing) throw new ApiError(409, 'A tutor profile already exists. Use the update route to edit it.')
  const profile = await prisma.tutorProfile.create({ data: { userId: req.user.id, ...profileData(req.validated.body) }, include: tutorInclude })
  sendData(res, publicTutor(profile), 201)
})

export const updateMyProfile = asyncHandler(async (req, res) => {
  const existing = await prisma.tutorProfile.findUnique({ where: { userId: req.user.id } })
  const resubmitting = existing?.verificationStatus === 'REJECTED'
  const profile = await prisma.$transaction(async (tx) => {
    const updated = await tx.tutorProfile.upsert({
      where: { userId: req.user.id },
      create: { userId: req.user.id, ...profileData(req.validated.body) },
      update: { ...profileData(req.validated.body), ...(resubmitting ? { verificationStatus: 'PENDING' } : {}) },
      include: tutorInclude,
    })
    if (resubmitting) await tx.notification.create({ data: { userId: req.user.id, title: 'Tutor profile resubmitted', message: 'Your updated profile is back in the verification queue.', type: 'TUTOR_VERIFICATION' } })
    return updated
  })
  sendData(res, publicTutor(profile))
})
