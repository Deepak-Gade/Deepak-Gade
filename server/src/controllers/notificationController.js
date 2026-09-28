import { prisma } from '../utils/prisma.js'
import { ApiError, asyncHandler, sendData } from '../utils/errors.js'

export const listNotifications = asyncHandler(async (req, res) => {
  const items = await prisma.notification.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: 'desc' }, take: 50 })
  sendData(res, items)
})

export const markNotificationRead = asyncHandler(async (req, res) => {
  const item = await prisma.notification.findUnique({ where: { id: req.params.id } })
  if (!item) throw new ApiError(404, 'Notification not found.')
  if (item.userId !== req.user.id) throw new ApiError(403, 'You cannot update this notification.')
  sendData(res, await prisma.notification.update({ where: { id: item.id }, data: { isRead: true } }))
})
