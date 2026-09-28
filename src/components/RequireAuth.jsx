import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { LoadingState } from './UI.jsx'

export default function RequireAuth({ roles, children }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <LoadingState label="Restoring your TutorLink session…" />
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  if (roles && !roles.includes(user.role)) {
    const destination = user.role === 'ADMIN' ? '/admin' : user.role === 'TUTOR' ? '/tutor/dashboard' : '/dashboard/student'
    return <Navigate to={destination} replace />
  }
  return children
}
