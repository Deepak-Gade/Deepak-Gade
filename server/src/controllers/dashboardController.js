import { prisma } from '../utils/prisma.js'
import { asyncHandler, sendData } from '../utils/errors.js'
import { scoreTutor } from '../services/matching.js'
import { publicTutor, parseList } from '../utils/values.js'

const requestInclude = { student: { select: { id: true, name: true, role: true } }, tutor: { include: { user: { select: { id: true, name: true, role: true } } } }, requirement: true }
const mapRequest = (item) => ({ ...item, tutor: publicTutor(item.tutor), requirement: item.requirement ? { ...item.requirement, subjects: parseList(item.requirement.subjects), preferredTimings: parseList(item.requirement.preferredTimings) } : null })

export const studentDashboard = asyncHandler(async (req, res) => {
  const [requirements, demoRequests, savedTutors, notifications] = await Promise.all([
    prisma.studentRequirement.findMany({ where: { studentId: req.user.id }, orderBy: { createdAt: 'desc' } }),
    prisma.demoRequest.findMany({ where: { studentId: req.user.id }, include: requestInclude, orderBy: { createdAt: 'desc' } }),
    prisma.savedTutor.findMany({ where: { studentId: req.user.id, tutor: { isVerified: true } }, include: { tutor: { include: { user: { select: { id: true, name: true, role: true } } } } }, orderBy: { createdAt: 'desc' } }),
    prisma.notification.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: 'desc' }, take: 10 })
  ])
  const requirement = requirements[0]
  let recommendedTutors = []
  if (requirement) {
    const profiles = await prisma.tutorProfile.findMany({ where: { isVerified: true }, include: { user: { select: { id: true, name: true, role: true } } } })
    recommendedTutors = profiles.map((profile) => scoreTutor(profile, requirement)).sort((a,b)=>b.matchPercentage-a.matchPercentage).slice(0,6)
  }
  sendData(res, { requirements: requirements.map((item)=>({...item,subjects:parseList(item.subjects),preferredTimings:parseList(item.preferredTimings)})), recommendedTutors, pendingRequests: demoRequests.filter((item)=>item.status==='PENDING').map(mapRequest), acceptedDemos: demoRequests.filter((item)=>item.status==='ACCEPTED').map(mapRequest), savedTutors: savedTutors.map((item)=>publicTutor(item.tutor)), notifications })
})

export const tutorDashboard = asyncHandler(async (req, res) => {
  const profile = await prisma.tutorProfile.findUnique({ where: { userId: req.user.id }, include: { user: { select: { id: true, name: true, role: true } } } })
  const demoRequests = profile ? await prisma.demoRequest.findMany({ where: { tutorId: profile.id }, include: requestInclude, orderBy: { preferredDate: 'asc' } }) : []
  const now = new Date()
  sendData(res, { profile: publicTutor(profile), profileViews: null, pendingRequests: demoRequests.filter((item)=>item.status==='PENDING').map(mapRequest), acceptedRequests: demoRequests.filter((item)=>item.status==='ACCEPTED').map(mapRequest), completedDemos: demoRequests.filter((item)=>item.status==='COMPLETED').map(mapRequest), upcomingDemos: demoRequests.filter((item)=>item.status==='ACCEPTED'&&item.preferredDate>=now).map(mapRequest), notifications: await prisma.notification.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: 'desc' }, take: 10 }) })
})
