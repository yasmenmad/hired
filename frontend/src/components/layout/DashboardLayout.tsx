import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import {
  Briefcase, FileText, LayoutDashboard, Mic2,
  User, Bell, LogOut, Settings, ShieldCheck
} from 'lucide-react'

const navItems = [
  { to: '/app/jobs',      icon: Briefcase,       label: 'Job Feed' },
  { to: '/app/cv',        icon: FileText,         label: 'CV Optimizer' },
  { to: '/app/tracker',   icon: LayoutDashboard,  label: 'Tracker' },
  { to: '/app/interview', icon: Mic2,             label: 'Simulateur' },
]

export default function DashboardLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#060a12', color: '#e2e8f0', fontFamily: 'system-ui,sans-serif' }}>

      {/* SIDEBAR */}
      <aside style={{
        width: 240, flexShrink: 0, background: '#0d1421',
        borderRight: '1px solid #1a2840', display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 50
      }}>
        {/* Logo */}
        <div style={{ padding: '24px 20px', borderBottom: '1px solid #1a2840' }}>
          <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: -1 }}>
            <span style={{ color: '#00ff88' }}>H</span>ired
          </span>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
              borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 600,
              color: isActive ? '#00ff88' : '#64748b',
              background: isActive ? 'rgba(0,255,136,0.08)' : 'transparent',
              borderLeft: isActive ? '3px solid #00ff88' : '3px solid transparent',
              transition: 'all .15s'
            })}>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}

          {user?.role === 'admin' && (
            <NavLink to="/app/admin" style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
              borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 600,
              color: isActive ? '#f472b6' : '#64748b',
              background: isActive ? 'rgba(244,114,182,0.08)' : 'transparent',
              borderLeft: isActive ? '3px solid #f472b6' : '3px solid transparent',
              marginTop: 16
            })}>
              <ShieldCheck size={18} />
              Admin Panel
            </NavLink>
          )}
        </nav>

        {/* User footer */}
        <div style={{ padding: '16px 12px', borderTop: '1px solid #1a2840' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'linear-gradient(135deg,#00ff88,#38bdf8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 700, color: '#000', flexShrink: 0
            }}>
              {user?.prenom?.[0]}{user?.nom?.[0]}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.prenom} {user?.nom}
              </div>
              <div style={{ fontSize: 11, color: '#64748b' }}>{user?.role}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => navigate('/app/profile')} style={btnStyle}>
              <User size={15} />
            </button>
            <button style={btnStyle}><Bell size={15} /></button>
            <button style={btnStyle}><Settings size={15} /></button>
            <button onClick={logout} style={{ ...btnStyle, marginLeft: 'auto', color: '#f87171' }}>
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ marginLeft: 240, flex: 1, minHeight: '100vh', overflow: 'auto' }}>
        <Outlet />
      </main>
    </div>
  )
}

const btnStyle: React.CSSProperties = {
  background: '#111d2e', border: '1px solid #1a2840', borderRadius: 6,
  padding: '6px 8px', cursor: 'pointer', color: '#64748b', display: 'flex',
  alignItems: 'center', justifyContent: 'center', transition: 'all .15s'
}
