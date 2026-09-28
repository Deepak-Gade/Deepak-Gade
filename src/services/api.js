const baseUrl = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')
const tokenKey = 'tutorlink.accessToken'

export class ApiError extends Error {
  constructor(message, status, errors) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
  }
}

export function getToken() {
  return window.localStorage.getItem(tokenKey)
}

export function setToken(token) {
  if (token) window.localStorage.setItem(tokenKey, token)
  else window.localStorage.removeItem(tokenKey)
}

async function request(path, options = {}) {
  const headers = new Headers(options.headers || {})
  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json')
  let response
  try {
    response = await fetch(`${baseUrl}${path}`, { ...options, headers, body: options.body && !(options.body instanceof FormData) ? JSON.stringify(options.body) : options.body })
  } catch {
    throw new ApiError('TutorLink could not reach the server. Check that the API is running and try again.', 0)
  }
  if (response.status === 204) return null
  const result = await response.json().catch(() => null)
  if (!response.ok || result?.success === false) throw new ApiError(result?.message || `Request failed (${response.status}).`, response.status, result?.errors)
  return result?.data ?? result
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  delete: (path) => request(path, { method: 'DELETE' }),
}

export function mapTutor(tutor, matchPercentage) {
  return {
    ...tutor,
    name: tutor.name || tutor.user?.name || 'Tutor',
    fee: tutor.fees,
    mode: tutor.teachingMode || [],
    location: (tutor.locations || [])[0] || 'Location flexible',
    match: matchPercentage ?? tutor.matchPercentage,
    verified: Boolean(tutor.isVerified),
    rating: null,
    reviews: 0,
  }
}

export function mapDemoStatus(status) {
  return status ? `${status[0]}${status.slice(1).toLowerCase()}` : status
}
