import { prisma } from '../utils/prisma.js'
import { ApiError, asyncHandler, sendData } from '../utils/errors.js'
import { publicTutor } from '../utils/values.js'

export const saveTutor = asyncHandler(async (req, res) => {
  const tutor = await prisma.tutorProfile.findUnique({ where: { id: req.params.tutorId } })
  if (!tutor) throw new ApiError(404, 'Tutor profile not found.')
  if (!tutor.isVerified) throw new ApiError(404, 'This tutor is not available to save yet.')
  const saved = await prisma.savedTutor.upsert({ where: { studentId_tutorId: { studentId: req.user.id, tutorId: tutor.id } }, create: { studentId: req.user.id, tutorId: tutor.id }, update: {} })
  sendData(res, saved, 201)
})

export const unsaveTutor = asyncHandler(async (req, res) => {
  await prisma.savedTutor.deleteMany({ where: { studentId: req.user.id, tutorId: req.params.tutorId } })
  res.status(204).end()
})

export const getSavedTutors = asyncHandler(async (req, res) => {
  const items = await prisma.savedTutor.findMany({ where: { studentId: req.user.id, tutor: { isVerified: true } }, include: { tutor: { include: { user: { select: { id: true, name: true, role: true } } } } }, orderBy: { createdAt: 'desc' } })
  sendData(res, items.map((item) => ({ savedAt: item.createdAt, tutor: publicTutor(item.tutor) })))
})
