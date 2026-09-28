import { prisma } from '../utils/prisma.js'
import { ApiError, asyncHandler, sendData } from '../utils/errors.js'
import { parseList, publicTutor } from '../utils/values.js'

const personSelect = { id: true, name: true, email: true, phone: true, role: true, createdAt: true }
const demoInclude = {
  student: { select: personSelect },
  tutor: { include: { user: { select: personSelect } } },
  requirement: true,
}

function presentDemo(item) {
  return {
    ...item,
    student: item.student,
    tutor: { ...publicTutor(item.tutor), email: item.tutor.user.email },
    requirement: item.requirement ? {
      ...item.requirement,
      subjects: parseList(item.requirement.subjects),
      preferredTimings: parseList(item.requirement.preferredTimings),
    } : null,
  }
}

export const adminDashboard = asyncHandler(async (_req, res) => {
  const [students, tutors, verifiedTutors, pendingTutors, rejectedTutors, requestGroups, recentRequests, pendingTutorProfiles] = await Promise.all([
    prisma.user.count({ where: { role: 'STUDENT' } }),
    prisma.user.count({ where: { role: 'TUTOR' } }),
    prisma.tutorProfile.count({ where: { isVerified: true } }),
    prisma.tutorProfile.count({ where: { verificationStatus: 'PENDING' } }),
    prisma.tutorProfile.count({ where: { verificationStatus: 'REJECTED' } }),
    prisma.demoRequest.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.demoRequest.findMany({
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: { student: { select: { id: true, name: true } }, tutor: { include: { user: { select: { id: true, name: true } } } } },
    }),
    prisma.tutorProfile.findMany({
      where: { verificationStatus: 'PENDING' },
      take: 5,
      include: { user: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: 'asc' },
    }),
  ])
  const requestCounts = Object.fromEntries(requestGroups.map(({ status, _count }) => [status.toLowerCase(), _count._all]))
  const months = Array.from({ length: 12 }, (_, index) => {
    const date = new Date()
    date.setDate(1)
    date.setMonth(date.getMonth() - (11 - index))
    return { key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`, label: date.toLocaleString('en', { month: 'short' }), students: 0, tutors: 0, requests: 0 }
  })
  const start = new Date(`${months[0].key}-01T00:00:00.000Z`)
  const [studentActivity, tutorActivity, requestActivity] = await Promise.all([
    prisma.user.findMany({ where: { role: 'STUDENT', createdAt: { gte: start } }, select: { createdAt: true } }),
    prisma.tutorProfile.findMany({ where: { createdAt: { gte: start } }, select: { createdAt: true } }),
    prisma.demoRequest.findMany({ where: { createdAt: { gte: start } }, select: { createdAt: true } }),
  ])
  const addActivity = (items, key) => items.forEach(({ createdAt }) => {
    const month = months.find((entry) => entry.key === `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}`)
    if (month) month[key] += 1
  })
  addActivity(studentActivity, 'students')
  addActivity(tutorActivity, 'tutors')
  addActivity(requestActivity, 'requests')

  const totalDemoRequests = Object.values(requestCounts).reduce((total, count) => total + count, 0)
  sendData(res, {
    totals: {
      students, tutors, verifiedTutors, pendingTutors, rejectedTutors, totalDemoRequests,
      pendingRequests: requestCounts.pending || 0,
      acceptedRequests: requestCounts.accepted || 0,
      completedRequests: requestCounts.completed || 0,
      activeRequests: requestCounts.pending || 0,
      demoBookings: (requestCounts.pending || 0) + (requestCounts.accepted || 0),
    },
    requestCounts,
    pendingTutors: pendingTutorProfiles.map((profile) => publicTutor(profile)),
    monthlyActivity: months,
    recentRequests: recentRequests.map((item) => ({ id: item.id, student: item.student.name, tutor: item.tutor.user.name, subject: item.subject, status: item.status, preferredDate: item.preferredDate })),
  })
})

export const adminTutors = asyncHandler(async (req, res) => {
  const profiles = await prisma.tutorProfile.findMany({
    include: { user: { select: personSelect } },
    orderBy: [{ verificationStatus: 'asc' }, { createdAt: 'desc' }],
  })
  const query = String(req.validated?.query?.q || '').trim().toLowerCase()
  const filtered = query ? profiles.filter((profile) => [profile.user.name, profile.user.email, profile.qualification, ...parseList(profile.subjects)].join(' ').toLowerCase().includes(query)) : profiles
  sendData(res, filtered.map((profile) => ({ ...publicTutor(profile), email: profile.user.email, phone: profile.user.phone, joinedAt: profile.user.createdAt })))
})

export const verifyTutor = asyncHandler(async (req, res) => {
  const profile = await prisma.tutorProfile.findUnique({ where: { id: req.params.id } })
  if (!profile) throw new ApiError(404, 'Tutor profile not found.')
  const isVerified = req.validated.body.isVerified
  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.tutorProfile.update({
      where: { id: profile.id },
      data: { isVerified, verificationStatus: isVerified ? 'VERIFIED' : 'REJECTED' },
      include: { user: { select: { id: true, name: true, role: true } } },
    })
    await tx.adminAction.create({ data: { adminId: req.user.id, action: isVerified ? 'VERIFIED_TUTOR' : 'REJECTED_TUTOR', targetType: 'TutorProfile', targetId: profile.id } })
    await tx.notification.create({
      data: {
        userId: profile.userId,
        title: isVerified ? 'Tutor profile verified' : 'Tutor profile not approved',
        message: isVerified ? 'Your TutorLink profile has been verified and is visible to students.' : 'Your TutorLink profile was not approved. Update it and contact support if you need help.',
        type: 'TUTOR_VERIFICATION',
      },
    })
    return result
  })
  sendData(res, publicTutor(updated))
})

export const adminStudents = asyncHandler(async (req, res) => {
  const users = await prisma.user.findMany({
    where: { role: 'STUDENT' },
    select: { ...personSelect, _count: { select: { studentRequirements: true, studentDemoRequests: true, savedTutors: true } } },
    orderBy: { createdAt: 'desc' },
  })
  const query = String(req.validated?.query?.q || '').trim().toLowerCase()
  sendData(res, query ? users.filter((user) => `${user.name} ${user.email} ${user.phone || ''}`.toLowerCase().includes(query)) : users)
})

export const adminRequirements = asyncHandler(async (req, res) => {
  const studentId = req.validated?.query?.studentId
  const where = studentId ? { studentId } : undefined
  const requirements = await prisma.studentRequirement.findMany({
    where,
    include: { student: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  })
  sendData(res, requirements.map((item) => ({ ...item, subjects: parseList(item.subjects), preferredTimings: parseList(item.preferredTimings) })))
})

export const adminDemoRequests = asyncHandler(async (req, res) => {
  const items = await prisma.demoRequest.findMany({ include: demoInclude, orderBy: { createdAt: 'desc' } })
  const query = String(req.validated?.query?.q || '').trim().toLowerCase()
  const filtered = query ? items.filter((item) => `${item.student.name} ${item.student.email} ${item.tutor.user.name} ${item.tutor.user.email} ${item.subject}`.toLowerCase().includes(query)) : items
  sendData(res, filtered.map(presentDemo))
})

export const adminDemoRequestDetail = asyncHandler(async (req, res) => {
  const item = await prisma.demoRequest.findUnique({ where: { id: req.params.id }, include: demoInclude })
  if (!item) throw new ApiError(404, 'Demo request not found.')
  sendData(res, presentDemo(item))
})

export const adminUpdateDemoStatus = asyncHandler(async (req, res) => {
  const item = await prisma.demoRequest.findUnique({ where: { id: req.params.id }, include: demoInclude })
  if (!item) throw new ApiError(404, 'Demo request not found.')
  const status = req.validated.body.status
  const updated = await prisma.$transaction(async (tx) => {
    const request = await tx.demoRequest.update({ where: { id: item.id }, data: { status }, include: demoInclude })
    await tx.adminAction.create({ data: { adminId: req.user.id, action: `SET_DEMO_${status}`, targetType: 'DemoRequest', targetId: item.id } })
    const notification = { title: 'Demo request updated', message: `An admin changed the ${item.subject} demo request to ${status.toLowerCase()}.`, type: 'DEMO_STATUS' }
    await tx.notification.create({ data: { ...notification, userId: item.studentId } })
    await tx.notification.create({ data: { ...notification, userId: item.tutor.userId } })
    return request
  })
  sendData(res, presentDemo(updated))
})
