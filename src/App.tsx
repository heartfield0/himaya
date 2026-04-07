import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/useAuth'
import RequireAuth from './components/RequireAuth'
import AdminLayout from './layouts/AdminLayout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/admin/DashboardPage'
import PagesListPage from './pages/admin/PagesListPage'
import NewPage from './pages/admin/NewPage'
import EditPage from './pages/admin/EditPage'
import PublicMessagePage from './pages/public/PublicMessagePage'
import CustomerEditMessagePage from './pages/public/CustomerEditMessagePage'

function HomeRedirect() {
  const { isAuthenticated, isInitializing } = useAuth()
  if (isInitializing) return <div className="login-page"><div className="login-card">Checking session...</div></div>
  return <Navigate to={isAuthenticated ? '/admin/dashboard' : '/login'} replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/m/:slug" element={<PublicMessagePage />} />
      <Route path="/edit-message/:slug" element={<CustomerEditMessagePage />} />

      <Route element={<RequireAuth />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="pages" element={<PagesListPage />} />
          <Route path="pages/new" element={<NewPage />} />
          <Route path="pages/:id/edit" element={<EditPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

