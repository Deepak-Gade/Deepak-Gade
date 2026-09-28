import { prisma } from '../utils/prisma.js'
export function createNotification({ userId, title, message, type }) {
  return prisma.notification.create({ data: { userId, title, message, type } })
}
