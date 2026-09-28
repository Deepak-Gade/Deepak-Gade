import { Navigate, Route, Routes } from 'react-router-dom'
import SiteLayout from './layouts/SiteLayout.jsx'
import HomePage from './pages/HomePage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import SignupPage from './pages/SignupPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RequirementsPage from './pages/RequirementsPage.jsx'
import TutorsPage from './pages/TutorsPage.jsx'
import TutorProfilePage from './pages/TutorProfilePage.jsx'
import BookDemoPage from './pages/BookDemoPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import TutorWorkspacePage from './pages/TutorWorkspacePage.jsx'
import AdminPage from './pages/AdminPage.jsx'
import PlaceholderPage from './pages/PlaceholderPage.jsx'
import RequireAuth from './components/RequireAuth.jsx'

export default function App() {
  return <Routes><Route element={<SiteLayout />}>
    <Route path="/" element={<HomePage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/register/student" element={<SignupPage role="student" />} />
    <Route path="/register/tutor" element={<SignupPage role="tutor" />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/requirements" element={<RequireAuth roles={['STUDENT']}><RequirementsPage /></RequireAuth>} />
    <Route path="/tutors" element={<TutorsPage />} />
    <Route path="/tutors/:id" element={<TutorProfilePage />} />
    <Route path="/tutors/:id/book-demo" element={<RequireAuth roles={['STUDENT']}><BookDemoPage /></RequireAuth>} />
    <Route path="/dashboard" element={<Navigate to="/dashboard/student" replace />} />
    <Route path="/dashboard/student" element={<RequireAuth roles={['STUDENT']}><DashboardPage /></RequireAuth>} />
    <Route path="/tutor/profile" element={<RequireAuth roles={['TUTOR']}><TutorWorkspacePage view="profile" /></RequireAuth>} />
    <Route path="/tutor/dashboard" element={<RequireAuth roles={['TUTOR']}><TutorWorkspacePage view="dashboard" /></RequireAuth>} />
    <Route path="/tutor/requests" element={<RequireAuth roles={['TUTOR']}><TutorWorkspacePage view="requests" /></RequireAuth>} />
    <Route path="/tutor/bookings" element={<RequireAuth roles={['TUTOR']}><TutorWorkspacePage view="bookings" /></RequireAuth>} />
    <Route path="/admin" element={<RequireAuth roles={['ADMIN']}><AdminPage view="overview" /></RequireAuth>} />
    <Route path="/admin/tutors" element={<RequireAuth roles={['ADMIN']}><AdminPage view="tutors" /></RequireAuth>} />
    <Route path="/admin/students" element={<RequireAuth roles={['ADMIN']}><AdminPage view="students" /></RequireAuth>} />
    <Route path="/admin/requests" element={<RequireAuth roles={['ADMIN']}><AdminPage view="requests" /></RequireAuth>} />
    <Route path="/admin/analytics" element={<RequireAuth roles={['ADMIN']}><AdminPage view="analytics" /></RequireAuth>} />
    <Route path="*" element={<PlaceholderPage title="Page not found" description="The page you are looking for does not exist." />} />
  </Route></Routes>
}
