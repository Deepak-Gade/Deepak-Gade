import { prisma } from '../utils/prisma.js'
import { ApiError, asyncHandler, sendData } from '../utils/errors.js'
import { parseList, publicTutor } from '../utils/values.js'

const demoInclude = { student: { select: { id: true, name: true, role: true } }, tutor: { include: { user: { select: { id: true, name: true, role: true } } } } }
function presentDemo(request) { return { ...request, tutor: publicTutor(request.tutor), requirement: request.requirement ? { ...request.requirement, subjects: parseList(request.requirement.subjects), preferredTimings: parseList(request.requirement.preferredTimings) } : null } }

export const createDemoRequest = asyncHandler(async (req, res) => {
  const body = req.validated.body
  const tutor = await prisma.tutorProfile.findUnique({ where: { id: body.tutorId }, include: { user: true } })
  if (!tutor) throw new ApiError(404, 'Tutor profile not found.')
  if (!tutor.isVerified) throw new ApiError(404, 'This tutor is not accepting student requests yet.')
  if (!parseList(tutor.teachingMode).includes(body.mode) && !parseList(tutor.teachingMode).includes('Both')) throw new ApiError(400, 'This tutor does not offer the selected teaching mode.')
  if (body.requirementId) {
    const requirement = await prisma.studentRequirement.findUnique({ where: { id: body.requirementId } })
    if (!requirement || requirement.studentId !== req.user.id) throw new ApiError(400, 'The selected learning requirement is not available.')
  }
  const created = await prisma.$transaction(async (tx) => {
    const request = await tx.demoRequest.create({ data: { ...body, studentId: req.user.id, location: body.location || null, notes: body.notes || null }, include: demoInclude })
    await tx.notification.create({ data: { userId: tutor.userId, title: 'New demo request', message: `${req.user.name} requested a ${body.subject} demo class.`, type: 'DEMO_REQUEST' } })
    return request
  })
  sendData(res, presentDemo(created), 201)
})

export const getStudentDemoRequests = asyncHandler(async (req, res) => {
  const items = await prisma.demoRequest.findMany({ where: { studentId: req.user.id }, include: { ...demoInclude, requirement: true }, orderBy: { createdAt: 'desc' } })
  sendData(res, items.map(presentDemo))
})

export const getTutorDemoRequests = asyncHandler(async (req, res) => {
  const profile = await prisma.tutorProfile.findUnique({ where: { userId: req.user.id } })
  if (!profile) return sendData(res, [])
  const items = await prisma.demoRequest.findMany({ where: { tutorId: profile.id }, include: { ...demoInclude, requirement: true }, orderBy: { createdAt: 'desc' } })
  sendData(res, items.map(presentDemo))
})

export const getDemoRequest = asyncHandler(async (req, res) => {
  const item = await prisma.demoRequest.findUnique({ where: { id: req.params.id }, include: { ...demoInclude, requirement: true } })
  if (!item) throw new ApiError(404, 'Demo request not found.')
  const isTutor = req.user.role === 'TUTOR' && item.tutor.userId === req.user.id
  if (req.user.role !== 'ADMIN' && item.studentId !== req.user.id && !isTutor) throw new ApiError(403, 'You do not have access to this request.')
  sendData(res, presentDemo(item))
})

export const updateDemoStatus = asyncHandler(async (req, res) => {
  const { status } = req.validated.body
  const item = await prisma.demoRequest.findUnique({ where: { id: req.params.id }, include: demoInclude })
  if (!item) throw new ApiError(404, 'Demo request not found.')
  const isTutorOwner = req.user.role === 'TUTOR' && item.tutor.userId === req.user.id
  const isStudentOwner = req.user.role === 'STUDENT' && item.studentId === req.user.id
  const tutorStatus = ['ACCEPTED', 'DECLINED'].includes(status)
  const studentStatus = status === 'CANCELLED'
  if (req.user.role !== 'ADMIN' && !((isTutorOwner && tutorStatus) || (isStudentOwner && studentStatus))) throw new ApiError(403, 'You cannot change this request to that status.')
  if (item.status !== 'PENDING' && req.user.role !== 'ADMIN') throw new ApiError(409, 'Only pending requests can be changed by a student or tutor.')
  const updated = await prisma.$transaction(async (tx) => {
    const request = await tx.demoRequest.update({ where: { id: item.id }, data: { status }, include: demoInclude })
    const recipientId = isTutorOwner ? item.studentId : item.tutor.userId
    const statusLabel = status.toLowerCase()
    await tx.notification.create({ data: { userId: recipientId, title: `Demo request ${statusLabel}`, message: `${req.user.name} ${statusLabel} the ${item.subject} demo request.`, type: 'DEMO_STATUS' } })
    return request
  })
  sendData(res, presentDemo(updated))
})
