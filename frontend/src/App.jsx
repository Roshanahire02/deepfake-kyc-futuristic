import { Routes, Route, Navigate } from 'react-router-dom'
import PublicLayout from './layouts/PublicLayout'
import AppShell from './layouts/AppShell'
import ProtectedRoute from './components/ProtectedRoute'

import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import CreateCase from './pages/CreateCase'
import CaseList from './pages/CaseList'
import CaseDetail from './pages/CaseDetail'
import Results from './pages/Results'
import Profile from './pages/Profile'
import ModelStatus from './pages/ModelStatus'

import ReviewerDashboard from './pages/reviewer/ReviewerDashboard'
import ReviewerCases from './pages/reviewer/ReviewerCases'
import ReviewerQueue from './pages/reviewer/ReviewerQueue'
import ReviewerReports from './pages/reviewer/ReviewerReports'
import ReviewerCaseDetail from './pages/reviewer/ReviewerCaseDetail'

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Authenticated -- any role */}
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/models" element={<ModelStatus />} />
        <Route path="/profile" element={<Profile />} />

        {/* USER-only */}
        <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['USER']}><Dashboard /></ProtectedRoute>} />
        <Route path="/new-kyc" element={<ProtectedRoute allowedRoles={['USER']}><CreateCase /></ProtectedRoute>} />
        <Route path="/kyc/new" element={<Navigate to="/new-kyc" replace />} />
        <Route path="/cases" element={<ProtectedRoute allowedRoles={['USER']}><CaseList /></ProtectedRoute>} />
        <Route path="/cases/:caseId" element={<ProtectedRoute allowedRoles={['USER']}><CaseDetail /></ProtectedRoute>} />
        <Route path="/results" element={<ProtectedRoute allowedRoles={['USER']}><Results /></ProtectedRoute>} />

        {/* REVIEWER/ADMIN-only */}
        <Route path="/reviewer" element={<ProtectedRoute allowedRoles={['REVIEWER', 'ADMIN']}><ReviewerDashboard /></ProtectedRoute>} />
        <Route path="/reviewer/cases" element={<ProtectedRoute allowedRoles={['REVIEWER', 'ADMIN']}><ReviewerCases /></ProtectedRoute>} />
        <Route path="/reviewer/queue" element={<ProtectedRoute allowedRoles={['REVIEWER', 'ADMIN']}><ReviewerQueue /></ProtectedRoute>} />
        <Route path="/reviewer/reports" element={<ProtectedRoute allowedRoles={['REVIEWER', 'ADMIN']}><ReviewerReports /></ProtectedRoute>} />
        <Route path="/reviewer/cases/:caseId" element={<ProtectedRoute allowedRoles={['REVIEWER', 'ADMIN']}><ReviewerCaseDetail /></ProtectedRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
