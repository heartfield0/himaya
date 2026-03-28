import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Files, PlusCircle, LogOut, Menu, X } from 'lucide-react'
import { useAuth } from '../context/useAuth'
import himayaLogo from '../assets/logo/himaya-logo.png'

const EDIT_PAGE_PATH = /^\/admin\/pages\/[^/]+\/edit$/

function headerCopy(pathname: string): { eyebrow: string; title: string } {
  if (EDIT_PAGE_PATH.test(pathname)) {
    return { eyebrow: 'Himaya Workspace', title: 'Edit Page' }
  }
  if (pathname === '/admin/pages/new') {
    return { eyebrow: 'Himaya Workspace', title: 'Create New Page' }
  }
  if (pathname === '/admin/pages') {
    return { eyebrow: 'Himaya Workspace', title: 'Customer Pages' }
  }
  return { eyebrow: 'Himaya Workspace', title: 'Admin Dashboard' }
}

/** One nav highlight at a time; list + edit flows belong to Customer Pages, not Create. */
function adminNavActive(pathname: string, item: 'dashboard' | 'pages' | 'new'): boolean {
  switch (item) {
    case 'dashboard':
      return pathname === '/admin/dashboard'
    case 'pages':
      return pathname === '/admin/pages' || EDIT_PAGE_PATH.test(pathname)
    case 'new':
      return pathname === '/admin/pages/new'
    default:
      return false
  }
}

export default function AdminLayout() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [navOpen, setNavOpen] = useState(false)

  const { eyebrow, title } = headerCopy(pathname)

  useEffect(() => {
    setNavOpen(false)
  }, [pathname])

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const onChange = () => {
      if (mq.matches) setNavOpen(false)
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    if (!navOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setNavOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navOpen])

  useEffect(() => {
    if (!navOpen) {
      document.body.classList.remove('admin-nav-open')
      return
    }
    const mq = window.matchMedia('(max-width: 1023px)')
    const sync = () => {
      document.body.classList.toggle('admin-nav-open', mq.matches)
    }
    sync()
    mq.addEventListener('change', sync)
    return () => {
      mq.removeEventListener('change', sync)
      document.body.classList.remove('admin-nav-open')
    }
  }, [navOpen])

  const doLogout = async () => {
    setNavOpen(false)
    await logout()
    navigate('/login')
  }

  const closeNav = () => setNavOpen(false)
  const toggleNav = () => setNavOpen((open) => !open)

  return (
    <div className={`admin-shell${navOpen ? ' admin-shell--nav-open' : ''}`}>
      {navOpen ? (
        <button
          type="button"
          className="admin-nav-backdrop"
          aria-label="Close navigation menu"
          onClick={closeNav}
        />
      ) : null}

      <aside className="admin-sidebar" id="admin-nav-panel" aria-label="Main navigation">
        <div className="admin-sidebar-inner">
          <div className="admin-sidebar-head">
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
            <button
              type="button"
              className="admin-drawer-close ghost-btn"
              aria-label="Close menu"
              onClick={closeNav}
            >
              <X size={20} strokeWidth={2} aria-hidden />
            </button>
          </div>

          <nav className="admin-nav">
            <NavLink
              to="/admin/dashboard"
              end
              onClick={closeNav}
              className={() => (adminNavActive(pathname, 'dashboard') ? 'active' : '')}
              aria-current={adminNavActive(pathname, 'dashboard') ? 'page' : undefined}
            >
              <LayoutDashboard size={18} aria-hidden /> Dashboard
            </NavLink>
            <NavLink
              to="/admin/pages"
              end
              onClick={closeNav}
              className={() => (adminNavActive(pathname, 'pages') ? 'active' : '')}
              aria-current={adminNavActive(pathname, 'pages') ? 'page' : undefined}
            >
              <Files size={18} aria-hidden /> Customer Pages
            </NavLink>
            <NavLink
              to="/admin/pages/new"
              end
              onClick={closeNav}
              className={() => (adminNavActive(pathname, 'new') ? 'active' : '')}
              aria-current={adminNavActive(pathname, 'new') ? 'page' : undefined}
            >
              <PlusCircle size={18} aria-hidden /> Create New Page
            </NavLink>
          </nav>
        </div>

        <button type="button" className="ghost-btn admin-sidebar-logout" onClick={doLogout}>
          <LogOut size={16} aria-hidden /> Logout
        </button>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-leading">
            <button
              type="button"
              className="admin-menu-btn ghost-btn"
              aria-label={navOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={navOpen}
              aria-controls="admin-nav-panel"
              onClick={toggleNav}
            >
              {navOpen ? <X size={22} strokeWidth={2} aria-hidden /> : <Menu size={22} strokeWidth={2} aria-hidden />}
            </button>
            <div className="admin-topbar-titles">
              <p className="eyebrow">{eyebrow}</p>
              <h1>{title}</h1>
            </div>
          </div>
          <div className="admin-profile" title="admin@himaya.co">
            admin@himaya.co
          </div>
        </header>
        <section className="admin-content">
          <Outlet />
        </section>
      </main>
    </div>
  )
}
