const navigation = [
  { path: '/dashboard', label: 'Overview', icon: '▦' },
  { path: '/bookings', label: 'Bookings', icon: '⌁' },
  { path: '/vehicles', label: 'My vehicles', icon: '▰' },
  { path: '/payments', label: 'Payments & share', icon: '₹' },
  { path: '/feedback', label: 'Feedback', icon: '★' },
  { path: '/drivers', label: 'Driver directory', icon: '◎' },
]

export default function DriverLayout({ children, path, driver, onNavigate, onLogout }) {
  const visibleNavigation = driver?.driverStatus === 'approved' ? navigation : navigation.slice(0, 1)
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="/dashboard" onClick={(event) => { event.preventDefault(); onNavigate('/dashboard') }}>
          <span className="brand-mark">R</span><span>ride<span className="brand-local">local</span></span>
        </a>
        <div className="sidebar-label">DRIVER WORKSPACE</div>
        <nav className="side-nav" aria-label="Driver navigation">
          {visibleNavigation.map((item) => (
            <a key={item.path} href={item.path} className={path === item.path ? 'active' : ''}
              onClick={(event) => { event.preventDefault(); onNavigate(item.path) }}>
              <span className="nav-icon">{item.icon}</span>{item.label}
            </a>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="driver-mini-profile">
            <span className="avatar">{driver?.name?.[0]?.toUpperCase() || 'D'}</span>
            <span><b>{driver?.name || 'Driver'}</b><small>Driver account</small></span>
          </div>
          <button className="logout-button" onClick={onLogout}>↗ <span>Sign out</span></button>
        </div>
      </aside>
      <main className="main-panel">
        <header className="topbar">
          <div className="mobile-brand"><span className="brand-mark">R</span> ride local</div>
          <span className="topbar-caption">Your work, made simpler.</span>
          <div className="topbar-profile"><span className="online-dot" />{driver?.name || 'Driver'}</div>
        </header>
        <div className="page-content">{children}</div>
      </main>
    </div>
  )
}
