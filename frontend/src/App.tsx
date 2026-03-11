import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store/authStore'

import LandingPage    from './pages/LandingPage'
import LoginPage      from './pages/LoginPage'
import RegisterPage   from './pages/RegisterPage'
import DashboardLayout from './components/layout/DashboardLayout'
import JobFeedPage    from './pages/JobFeedPage'
import CVOptimizerPage from './pages/CVOptimizerPage'
import TrackerPage    from './pages/TrackerPage'
import InterviewPage  from './pages/InterviewPage'
import ProfilePage    from './pages/ProfilePage'
import AdminPage      from './pages/AdminPage'

const qc = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30000 } } })

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore()
  return user?.role === 'admin' ? <>{children}</> : <Navigate to="/app/jobs" replace />
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ style: { background: '#1a2235', color: '#e2e8f0', border: '1px solid #1e293b' } }} />
        <Routes>
          <Route path="/"         element={<LandingPage />} />
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/app" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
            <Route index element={<Navigate to="jobs" replace />} />
            <Route path="jobs"      element={<JobFeedPage />} />
            <Route path="cv"        element={<CVOptimizerPage />} />
            <Route path="tracker"   element={<TrackerPage />} />
            <Route path="interview" element={<InterviewPage />} />
            <Route path="profile"   element={<ProfilePage />} />
            <Route path="admin"     element={<AdminRoute><AdminPage /></AdminRoute>} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
