import StatusBadge from '../components/StatusBadge'

const money = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(value || 0))

export default function DashboardPage({ driver, stats, bookings, onNavigate, onRefresh, refreshing }) {
  if (driver?.driverStatus !== 'approved') {
    const rejected = driver?.driverStatus === 'rejected'
    return (
      <section className="approval-card">
        <div className={`approval-icon ${rejected ? 'rejected' : ''}`}>{rejected ? '!' : '◷'}</div>
        <span className="section-kicker">APPLICATION STATUS</span>
        <h1>{rejected ? 'Application not approved' : 'Your application is being reviewed'}</h1>
        <p>{rejected ? 'Please contact Ride Local support if you believe this is a mistake.' : 'You can sign in and review your profile while we verify your details. Booking features will unlock after approval.'}</p>
        <div className="approval-status"><span>Current status</span><StatusBadge>{driver?.driverStatus || 'pending'}</StatusBadge></div>
        <div className="profile-summary"><div><small>DRIVER</small><b>{driver?.name}</b></div><div><small>EMAIL</small><b>{driver?.email}</b></div><div><small>LICENCE</small><b>{driver?.licenseNumber}</b></div><div><small>ADDRESS</small><b>{driver?.address}</b></div></div>
      </section>
    )
  }

  const cards = [
    { title: 'Total bookings', value: stats.totalBookings, icon: '⌁', tone: 'green', foot: 'Assigned to you' },
    { title: 'Pending requests', value: stats.pending, icon: '◷', tone: 'amber', foot: 'Matching your vehicles' },
    { title: 'Accepted / active', value: stats.accepted, icon: '✓', tone: 'blue', foot: 'Ready to complete' },
    { title: 'Completed rides', value: stats.completed, icon: '▣', tone: 'violet', foot: 'Finished trips' },
  ]
  return (
    <div className="dashboard-page">
      <div className="page-heading dashboard-heading">
        <div><span className="section-kicker">DRIVER OVERVIEW</span><h1>Good day, {driver?.name?.split(' ')[0]}.</h1><p>Here’s what’s happening with your rides.</p></div>
        <button className="quiet-button" onClick={onRefresh} disabled={refreshing}>↻ Refresh</button>
      </div>
      <div className="stats-grid">{cards.map((card) => <article className="stat-card" key={card.title}><span className={`stat-icon ${card.tone}`}>{card.icon}</span><div><span>{card.title}</span><b>{card.value}</b><small>{card.foot}</small></div></article>)}</div>
      <div className="summary-grid">
        <section className="panel earnings-panel"><div className="panel-heading"><div><span className="section-kicker">YOUR EARNINGS</span><h2>Paid driver share</h2></div><span className="earnings-icon">₹</span></div><strong>{money(stats.earnings)}</strong><p>From paid rides · driver share is calculated automatically</p><button className="inline-link" onClick={() => onNavigate('/payments')}>View payment history <span>→</span></button></section>
        <section className="panel profile-panel"><div className="panel-heading"><div><span className="section-kicker">YOUR PROFILE</span><h2>Driver details</h2></div><StatusBadge>approved</StatusBadge></div><div className="profile-details"><div><small>PHONE</small><b>{driver?.phone}</b></div><div><small>EMAIL</small><b>{driver?.email}</b></div><div><small>LICENCE NUMBER</small><b>{driver?.licenseNumber}</b></div><div><small>ADDRESS</small><b>{driver?.address}</b></div></div></section>
      </div>
      <section className="panel recent-panel"><div className="panel-heading"><div><span className="section-kicker">RECENT ACTIVITY</span><h2>Latest bookings</h2></div><button className="inline-link" onClick={() => onNavigate('/bookings')}>All bookings →</button></div>
        {bookings.length ? <div className="table-wrap"><table><thead><tr><th>ROUTE</th><th>CUSTOMER</th><th>DATE</th><th>FARE</th><th>STATUS</th></tr></thead><tbody>{bookings.slice(0, 5).map((booking) => <tr key={booking._id}><td><b>{booking.pickup} → {booking.destination}</b><small>{booking.vehicleCategory} · {booking.travellingDuration || 0} min</small></td><td>{booking.customerId?.name || 'Customer'}</td><td>{new Date(booking.pickupTime || booking.createdAt).toLocaleDateString()}</td><td>{money(booking.estimatedFare)}</td><td><StatusBadge>{booking.status}</StatusBadge></td></tr>)}</tbody></table></div> : <div className="empty-state">Your assigned rides will appear here.</div>}
      </section>
    </div>
  )
}
