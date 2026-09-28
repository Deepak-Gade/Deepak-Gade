export const parseList = (value) => {
  if (Array.isArray(value)) return value
  if (typeof value !== 'string' || !value) return []
  try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed : [] } catch { return [] }
}
export const storeList = (value) => JSON.stringify(Array.isArray(value) ? value : [])
export const publicUser = ({ passwordHash: _passwordHash, ...user }) => user
export function publicTutor(profile) {
  if (!profile) return null
  const { user, userId: _userId, classes, subjects, teachingMode, locations, availableTimings, ...rest } = profile
  return { ...rest, name: user?.name, classes: parseList(classes), subjects: parseList(subjects), teachingMode: parseList(teachingMode), locations: parseList(locations), availableTimings: parseList(availableTimings), ...(user ? { user: { id: user.id, name: user.name, role: user.role } } : {}) }
}
