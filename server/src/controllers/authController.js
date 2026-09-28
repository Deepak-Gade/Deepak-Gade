import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../utils/prisma.js'
import { ApiError, asyncHandler, sendData } from '../utils/errors.js'
import { publicUser } from '../utils/values.js'

function issueToken(user) {
  if (!process.env.JWT_SECRET) throw new ApiError(500, 'Authentication is not configured. Set JWT_SECRET in server/.env.')
  return jwt.sign({ role: user.role }, process.env.JWT_SECRET, { subject: user.id, expiresIn: process.env.JWT_EXPIRES_IN || '7d' })
}

export const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role } = req.validated.body
  if (await prisma.user.findUnique({ where: { email } })) throw new ApiError(409, 'An account with this email already exists.')
  const passwordHash = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({ data: { name, email, phone: phone || null, passwordHash, role } })
  sendData(res, { user: publicUser(user), token: issueToken(user) }, 201)
})

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.validated.body
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) throw new ApiError(401, 'Email or password is incorrect.')
  sendData(res, { user: publicUser(user), token: issueToken(user) })
})

export const me = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id }, include: { tutorProfile: true } })
  sendData(res, { ...publicUser(user), tutorProfile: user.tutorProfile })
})
