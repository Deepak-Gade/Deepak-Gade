import { prisma } from '../utils/prisma.js'
import { ApiError, asyncHandler, sendData } from '../utils/errors.js'
import { storeList, parseList } from '../utils/values.js'
import { scoreTutor } from '../services/matching.js'

const requirementData = (data) => ({ className: data.className, subjects: storeList(data.subjects), teachingMode: data.teachingMode, location: data.location || null, pincode: data.pincode || null, budget: data.budget || null, preferredTimings: storeList(data.preferredTimings) })
const presentRequirement = (item) => ({ ...item, subjects: parseList(item.subjects), preferredTimings: parseList(item.preferredTimings) })

export const createRequirement = asyncHandler(async (req, res) => {
  const requirement = await prisma.studentRequirement.create({ data: { studentId: req.user.id, ...requirementData(req.validated.body) } })
  sendData(res, presentRequirement(requirement), 201)
})

export const getMyRequirements = asyncHandler(async (req, res) => {
  const requirements = await prisma.studentRequirement.findMany({ where: { studentId: req.user.id }, orderBy: { createdAt: 'desc' } })
  sendData(res, requirements.map(presentRequirement))
})

export const getRequirement = asyncHandler(async (req, res) => {
  const requirement = await prisma.studentRequirement.findUnique({ where: { id: req.params.id } })
  if (!requirement) throw new ApiError(404, 'Learning requirement not found.')
  if (req.user.role !== 'ADMIN' && requirement.studentId !== req.user.id) throw new ApiError(403, 'You do not have access to this requirement.')
  sendData(res, presentRequirement(requirement))
})

export const updateRequirement = asyncHandler(async (req, res) => {
  const current = await prisma.studentRequirement.findUnique({ where: { id: req.params.id } })
  if (!current) throw new ApiError(404, 'Learning requirement not found.')
  if (req.user.role !== 'ADMIN' && current.studentId !== req.user.id) throw new ApiError(403, 'You do not have access to this requirement.')
  const requirement = await prisma.studentRequirement.update({ where: { id: req.params.id }, data: requirementData(req.validated.body) })
  sendData(res, presentRequirement(requirement))
})

export const getMatches = asyncHandler(async (req, res) => {
  const requirement = await prisma.studentRequirement.findUnique({ where: { id: req.params.requirementId } })
  if (!requirement) throw new ApiError(404, 'Learning requirement not found.')
  if (req.user.role !== 'ADMIN' && requirement.studentId !== req.user.id) throw new ApiError(403, 'You do not have access to these matches.')
  const profiles = await prisma.tutorProfile.findMany({ where: { isVerified: true }, include: { user: { select: { id: true, name: true, role: true } } } })
  const matches = profiles.map((profile) => scoreTutor(profile, requirement)).sort((a, b) => b.matchPercentage - a.matchPercentage)
  sendData(res, { requirement: presentRequirement(requirement), matches })
})
