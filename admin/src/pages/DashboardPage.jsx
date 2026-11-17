import Panel from '../components/Panel'
import StatusBadge from '../components/StatusBadge'

const money = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(value || 0))

export default function DashboardPage({ adminName, drivers, pending, locations, collected, driverPayouts, bookings, onNavigate }) {
  const metrics = [
    { label: 'REGISTERED DRIVERS', value: drivers.length, detail: 'All driver applications', icon: '♧' },
    { label: 'AWAITING REVIEW', value: pending, detail: 'Applications need attention', icon: '◷', warn: true },
    { label: 'ACTIVE LOCATIONS', value: locations.length, detail: 'Pickup areas available', icon: '⌖' },
    { label: 'PAID / DRIVER SHARE', value: money(collected), detail: `${money(driverPayouts)} driver earnings`, icon: '₹' },
  ]
  return (
    <>
      <section className="admin-welcome">
        <div><span className="admin-eyebrow">YOUR CITY, YOUR COMMUNITY</span><h1>Welcome, {adminName?.split(' ')[0] || 'back'}.</h1><p>Manage your local rides, drivers, and service areas.</p></div>
        <div className="welcome-decoration">⌖</div>
      </section>
      <div className="metric-grid">{metrics.map((metric) => <article className={metric.warn ? 'metric-warn' : ''} key={metric.label}><span>{metric.label}</span><b>{metric.value}</b><small>{metric.detail}</small><i>{metric.icon}</i></article>)}</div>
      <Panel eyebrow="SERVICE ACTIVITY" title="Recent ride requests" count={`${bookings.length} recent`}>
        {bookings.length ? <div className="table-scroll"><table><thead><tr><th>ROUTE</th><th>CUSTOMER</th><th>DRIVER</th><th>FARE</th><th>STATUS</th></tr></thead><tbody>
          {bookings.slice(0, 8).map((booking) => <tr key={booking._id}>
            <td><b>{booking.pickup} → {booking.destination}</b><small>{booking.vehicleCategory} · {booking.travellingDuration || 0} min</small></td>
            <td>{booking.customerId?.name || '—'}</td><td>{booking.driverId?.name || 'Unassigned'}</td>
            <td>{money(booking.estimatedFare)}</td><td><StatusBadge>{booking.status}</StatusBadge></td>
          </tr>)}
        </tbody></table><button className="admin-text-link" onClick={() => onNavigate('/bookings')}>View all ride activity →</button></div> : <div className="admin-empty">Ride requests will appear here.</div>}
      </Panel>
    </>
  )
}
