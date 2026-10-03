import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'

// Public & Landing
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/Login'
import ContactPage from './pages/ContactPage'

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard'
import StudentAttendance from './pages/student/StudentAttendance'
import BunkCalculator from './pages/student/BunkCalculator'
import RecoveryCalculator from './pages/student/RecoveryCalculator'
import StudentMarks from './pages/student/StudentMarks'
import AcademicRisk from './pages/student/AcademicRisk'
import StudentProfile from './pages/student/StudentProfile'
import StudentNotifications from './pages/student/StudentNotifications'

// Professor Pages
import ProfessorDashboard from './pages/professor/ProfessorDashboard'
import ProfessorCourses from './pages/professor/ProfessorCourses'
import ProfessorAttendance from './pages/professor/ProfessorAttendance'
import ProfessorMarks from './pages/professor/ProfessorMarks'
import VoiceMarksEntry from './pages/professor/VoiceMarksEntry'
import ProfessorAnalytics from './pages/professor/ProfessorAnalytics'
import ProfessorAtRisk from './pages/professor/ProfessorAtRisk'
import ProfessorNotifications from './pages/professor/ProfessorNotifications'

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard'
import StudentManagement from './pages/admin/StudentManagement'
import ProfessorManagement from './pages/admin/ProfessorManagement'
import DepartmentManagement from './pages/admin/DepartmentManagement'
import CourseManagement from './pages/admin/CourseManagement'
import AcademicSettings from './pages/admin/AcademicSettings'
import NotificationHistory from './pages/admin/NotificationHistory'

// Route guard
function PrivateRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { user, isLoading } = useAuth()
  if (isLoading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-10 h-10 border-4 border-[#174A8B] border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!user) return <Navigate to="/" replace />
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/unauthorized" replace />
  return <>{children}</>
}

function Unauthorized() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#F7FAFC]">
      <div className="text-center">
        <div className="text-6xl mb-4">🔒</div>
        <h1 className="text-2xl font-bold text-slate-900">Access Denied</h1>
        <p className="text-slate-500 mt-2">You don't have permission to view this page.</p>
        <a href="/" className="mt-4 inline-block text-[#2476C7] font-medium hover:underline">
          Back to Home
        </a>
      </div>
    </div>
  )
}

function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#F7FAFC]">
      <div className="text-center">
        <div className="text-6xl mb-4">404</div>
        <h1 className="text-2xl font-bold text-slate-900">Page Not Found</h1>
        <p className="text-slate-500 mt-2">The page you're looking for doesn't exist.</p>
        <a href="/" className="mt-4 inline-block text-[#2476C7] font-medium hover:underline">
          Go Home
        </a>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Landing (Login is in homepage cards) */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Student Routes */}
          <Route path="/student/dashboard" element={
            <PrivateRoute allowedRoles={['student']}>
              <StudentDashboard />
            </PrivateRoute>
          } />
          <Route path="/student/attendance" element={
            <PrivateRoute allowedRoles={['student']}>
              <StudentAttendance />
            </PrivateRoute>
          } />
          <Route path="/student/bunk-calculator" element={
            <PrivateRoute allowedRoles={['student']}>
              <BunkCalculator />
            </PrivateRoute>
          } />
          <Route path="/student/recovery-calculator" element={
            <PrivateRoute allowedRoles={['student']}>
              <RecoveryCalculator />
            </PrivateRoute>
          } />
          <Route path="/student/marks" element={
            <PrivateRoute allowedRoles={['student']}>
              <StudentMarks />
            </PrivateRoute>
          } />
          <Route path="/student/risk" element={
            <PrivateRoute allowedRoles={['student']}>
              <AcademicRisk />
            </PrivateRoute>
          } />
          <Route path="/student/notifications" element={
            <PrivateRoute allowedRoles={['student']}>
              <StudentNotifications />
            </PrivateRoute>
          } />
          <Route path="/student/profile" element={
            <PrivateRoute allowedRoles={['student']}>
              <StudentProfile />
            </PrivateRoute>
          } />

          {/* Professor Routes */}
          <Route path="/professor/dashboard" element={
            <PrivateRoute allowedRoles={['professor']}>
              <ProfessorDashboard />
            </PrivateRoute>
          } />
          <Route path="/professor/courses" element={
            <PrivateRoute allowedRoles={['professor']}>
              <ProfessorCourses />
            </PrivateRoute>
          } />
          <Route path="/professor/attendance" element={
            <PrivateRoute allowedRoles={['professor']}>
              <ProfessorAttendance />
            </PrivateRoute>
          } />
          <Route path="/professor/marks" element={
            <PrivateRoute allowedRoles={['professor']}>
              <ProfessorMarks />
            </PrivateRoute>
          } />
          <Route path="/professor/voice-marks" element={
            <PrivateRoute allowedRoles={['professor']}>
              <VoiceMarksEntry />
            </PrivateRoute>
          } />
          <Route path="/professor/analytics" element={
            <PrivateRoute allowedRoles={['professor']}>
              <ProfessorAnalytics />
            </PrivateRoute>
          } />
          <Route path="/professor/at-risk" element={
            <PrivateRoute allowedRoles={['professor']}>
              <ProfessorAtRisk />
            </PrivateRoute>
          } />
          <Route path="/professor/notifications" element={
            <PrivateRoute allowedRoles={['professor']}>
              <ProfessorNotifications />
            </PrivateRoute>
          } />

          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={
            <PrivateRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </PrivateRoute>
          } />
          <Route path="/admin/students" element={
            <PrivateRoute allowedRoles={['admin']}>
              <StudentManagement />
            </PrivateRoute>
          } />
          <Route path="/admin/professors" element={
            <PrivateRoute allowedRoles={['admin']}>
              <ProfessorManagement />
            </PrivateRoute>
          } />
          <Route path="/admin/departments" element={
            <PrivateRoute allowedRoles={['admin']}>
              <DepartmentManagement />
            </PrivateRoute>
          } />
          <Route path="/admin/courses" element={
            <PrivateRoute allowedRoles={['admin']}>
              <CourseManagement />
            </PrivateRoute>
          } />
          <Route path="/admin/settings" element={
            <PrivateRoute allowedRoles={['admin']}>
              <AcademicSettings />
            </PrivateRoute>
          } />
          <Route path="/admin/notifications" element={
            <PrivateRoute allowedRoles={['admin']}>
              <NotificationHistory />
            </PrivateRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
