export class ApiError extends Error {
  constructor(status, message, details) {
    super(message)
    this.status = status
    this.details = details
  }
}

export const asyncHandler = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next)
export const sendData = (res, data, status = 200) => res.status(status).json({ success: true, data })

export function errorHandler(error, _req, res, _next) {
  if (res.headersSent) return
  const status = Number.isInteger(error.status) ? error.status : error.name === 'ZodError' || error instanceof SyntaxError ? 400 : error.code === 'P2002' ? 409 : error.code === 'P2025' ? 404 : 500
  const message = status >= 500 ? 'An unexpected server error occurred.' : error.message
  const body = { success: false, message }
  if (error.details) body.errors = error.details
  if (error.name === 'ZodError') body.errors = error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message }))
  if (process.env.NODE_ENV !== 'production' && status >= 500) console.error(error)
  res.status(status).json(body)
}
