import { useState } from 'react'

const navigation = [
  { path: '/overview', label: 'Overview', icon: '▦' },
  { path: '/drivers', label: 'Drivers', icon: '♧' },
  { path: '/locations', label: 'Service areas', icon: '⌖' },
  { path: '/categories', label: 'Vehicle categories', icon: '▤' },
  { path: '/fleet', label: 'Fleet', icon: '▰' },
  { path: '/bookings', label: 'Ride activity', icon: '↗' },
  { path: '/payments', label: 'Payments', icon: '₹' },
  { path: '/feedback', label: 'Feedback', icon: '★' },
]

export default function AdminLayout({ children, session, path, pending, today, onNavigate, onLogout, onRefresh, loading }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const activePath = path === '/' ? '/overview' : path
  const goTo = (nextPath) => {
    setMenuOpen(false)
    onNavigate(nextPath)
  }
  return (
    <div className="admin-shell">
      <aside className={`admin-sidebar ${menuOpen ? 'admin-sidebar-open' : ''}`}>
        <a href="/overview" className="admin-logo" onClick={(event) => { event.preventDefault(); goTo('/overview') }}><span>R</span> Ride Local <small>ADMIN</small></a>
        <div className="side-caption">WORKSPACE</div>
        <nav id="admin-navigation" className="admin-navigation" aria-label="Admin navigation">
          {navigation.map((item) => (
            <a key={item.path} className={`side-link ${activePath === item.path ? 'active' : ''}`} href={item.path}
              onClick={(event) => { event.preventDefault(); goTo(item.path) }}>
              <span className="admin-nav-icon">{item.icon}</span><span>{item.label}</span>
              {item.path === '/drivers' && pending > 0 && <b>{pending}</b>}
            </a>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <span className="admin-avatar">{session.user.name?.[0]?.toUpperCase()}</span>
          <span><b>{session.user.name}</b><small>Administrator</small></span>
          <button onClick={onLogout} aria-label="Sign out">↪</button>
        </div>
      </aside>
      <main className="admin-main">
        <header className="admin-topbar">
          <button className="admin-menu-toggle" aria-expanded={menuOpen} aria-controls="admin-navigation" onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? 'Close' : 'Menu'}</button>
          <span>{today.toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
          <div><span className="admin-live"><i /> System online</span><button onClick={onRefresh} disabled={loading}>{loading ? 'Loading…' : '↻ Refresh data'}</button></div>
        </header>
        {children}
        <footer className="admin-footer"><b>RIDE LOCAL <span>ADMIN CONSOLE</span></b><span>Built for your neighborhood.</span></footer>
      </main>
    </div>
  )
}
