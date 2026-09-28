import jwt from 'jsonwebtoken'
import { prisma } from '../utils/prisma.js'
import { ApiError, asyncHandler } from '../utils/errors.js'
import { publicUser } from '../utils/values.js'

export const requireAuth = asyncHandler(async (req, _res, next) => {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '')
  if (!token) throw new ApiError(401, 'Please sign in to continue.')
  let claims
  try { claims = jwt.verify(token, process.env.JWT_SECRET) } catch { throw new ApiError(401, 'Your session is invalid or has expired. Please sign in again.') }
  const user = await prisma.user.findUnique({ where: { id: claims.sub } })
  if (!user) throw new ApiError(401, 'Your account could not be found.')
  req.user = publicUser(user)
  next()
})

export const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role)) return next(new ApiError(403, 'You do not have permission to access this resource.'))
  next()
}
