// src/components/Layout.tsx
import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth, useTeam } from '../stores'

const NAV = [
  { to: '/',          icon: '🏠', label: 'Dashboard' },
  { to: '/matches',   icon: '⚽', label: 'Partite' },
  { to: '/trainings', icon: '🏃', label: 'Allenamenti' },
  { to: '/chat',      icon: '💬', label: 'Chat' },
  { to: '/team',      icon: '👥', label: 'Squadra' },
  { to: '/payments',  icon: '💰', label: 'Quote' },
  { to: '/profile',   icon: '👤', label: 'Profilo' },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const { profile, signOut } = useAuth()
  const { team, role } = useTeam()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleSignOut = async () => { await signOut(); navigate('/auth') }

  const roleBadgeClass = role === 'manager' ? 'badge-orange' : role === 'coach' ? 'badge-blue' : 'badge-green'

  return (
    <div className="app-layout">
      {/* Mobile menu button */}
      <button className="mobile-menu-btn" onClick={() => setMobileOpen(o => !o)}>
        <span style={{ fontSize: 20 }}>☰</span>
      </button>

      {/* Overlay for mobile */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 99 }}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar${mobileOpen ? ' open' : ''}`}>
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="logo-text">Futsal<span>Mind</span></div>
          {team
            ? <div className="team-name">⚽ {team.name}</div>
            : <div className="team-name" style={{ color: 'var(--muted2)' }}>Nessuna squadra</div>
          }
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {NAV.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              <span className="nav-icon">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div style={{ padding: '12px 10px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', marginBottom: 6 }}>
            <div className="avatar avatar-sm" style={{ flexShrink: 0 }}>
              {(profile?.full_name || profile?.username || '?')[0].toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ color: 'var(--text)', fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {profile?.full_name || profile?.username}
              </div>
              {role && <span className={`badge ${roleBadgeClass}`} style={{ fontSize: 10, marginTop: 2 }}>{role}</span>}
            </div>
          </div>
          <button className="nav-item" onClick={handleSignOut} style={{ color: '#f87171', width: '100%' }}>
            <span className="nav-icon">🚪</span>
            Esci
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="main-content">
        {children}
      </main>
    </div>
  )
}
