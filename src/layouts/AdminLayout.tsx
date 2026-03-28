import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Files, PlusCircle, LogOut } from 'lucide-react'
import { useAuth } from '../context/useAuth'
import himayaLogo from '../assets/logo/himaya-logo.png'

export default function AdminLayout() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const doLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div>
          <div className="brand-block">
            <img
              src={himayaLogo}
              alt=""
              className="brand-logo-sidebar"
              decoding="async"
            />
            <div>
              <p className="brand-name">Himaya</p>
              <p className="brand-sub">Admin Studio</p>
            </div>
          </div>

          <nav className="admin-nav">
            <NavLink to="/admin/dashboard">
              <LayoutDashboard size={18} /> Dashboard
            </NavLink>
            <NavLink to="/admin/pages">
              <Files size={18} /> Customer Pages
            </NavLink>
            <NavLink to="/admin/pages/new">
              <PlusCircle size={18} /> Create New Page
            </NavLink>
          </nav>
        </div>

        <button className="ghost-btn" onClick={doLogout}>
          <LogOut size={16} /> Logout
        </button>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <p className="eyebrow">Himaya Workspace</p>
            <h1>Admin Dashboard</h1>
          </div>
          <div className="admin-profile">admin@himaya.co</div>
        </header>
        <section className="admin-content">
          <Outlet />
        </section>
      </main>
    </div>
  )
}

