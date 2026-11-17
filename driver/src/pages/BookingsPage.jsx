import StatusBadge from '../components/StatusBadge'

const money = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(value || 0))
const dateTime = (ride) => new Date(ride.pickupTime || ride.createdAt).toLocaleString()
const pickupNotStarted = (ride) => Boolean(ride.pickupTime && new Date(ride.pickupTime).getTime() > Date.now())

export default function BookingsPage({ bookings, onAction, busyId }) {
  const requests = bookings.filter((ride) => ride.isAvailable)
  const assigned = bookings.filter((ride) => !ride.isAvailable)
  return (
    <div className="page-stack">
      <div className="page-heading"><span className="section-kicker">RIDE MANAGEMENT</span><h1>Bookings & requests</h1><p>Review matching ride requests and manage your assigned trips.</p></div>
      <section className="panel">
        <div className="panel-heading"><div><span className="section-kicker">AVAILABLE TO YOU</span><h2>Ride requests <span className="count-pill">{requests.length}</span></h2></div></div>
        {requests.length ? <div className="booking-list">{requests.map((ride) => <article className="booking-card" key={ride._id}>
          <div className="booking-route"><span className="route-mark">⌁</span><div><b>{ride.pickup} <span>→</span> {ride.destination}</b><small>{dateTime(ride)} · {ride.travellingDuration || 0} min · {Number(ride.distanceKm || 0).toFixed(1)} km</small></div><StatusBadge>pending</StatusBadge></div>
          <div className="booking-meta"><span>Customer <b>{ride.customerId?.name || 'Customer'}</b></span><span>Phone <b>{ride.customerId?.phone || 'Not provided'}</b></span><span>Category <b>{ride.vehicleCategory}</b></span><span>Estimated fare <b>{money(ride.estimatedFare)}</b></span></div>
          <div className="booking-actions"><button className="primary-button" disabled={busyId === ride._id} onClick={() => onAction(ride, 'accept')}>{busyId === ride._id ? 'Please wait…' : 'Accept request'}</button><button className="quiet-button" disabled={busyId === ride._id} onClick={() => onAction(ride, 'reject')}>Dismiss</button></div>
        </article>)}</div> : <div className="empty-state">No matching requests right now. New requests are matched to your vehicle categories and service locations.</div>}
      </section>
      <section className="panel">
        <div className="panel-heading"><div><span className="section-kicker">ASSIGNED TRIPS</span><h2>Your rides <span className="count-pill">{assigned.length}</span></h2></div></div>
        {assigned.length ? <div className="table-wrap"><table><thead><tr><th>ROUTE / DATE</th><th>CUSTOMER</th><th>DURATION</th><th>FARE</th><th>STATUS</th><th>ACTION</th></tr></thead><tbody>{assigned.map((ride) => <tr key={ride._id}><td><b>{ride.pickup} → {ride.destination}</b><small>{dateTime(ride)}</small></td><td>{ride.customerId?.name}<small>{ride.customerId?.phone}</small></td><td>{ride.travellingDuration || 0} min</td><td>{money(ride.estimatedFare)}</td><td><StatusBadge>{ride.status}</StatusBadge></td><td>{ride.status === 'accepted' ? <><button className="table-action" disabled={busyId === ride._id || pickupNotStarted(ride)} title={pickupNotStarted(ride) ? 'This ride can only be started at its scheduled pickup time.' : undefined} onClick={() => onAction(ride, 'status', { status: 'ongoing' })}>Start ride</button>{pickupNotStarted(ride) && <small>Starts at {dateTime(ride)}</small>}</> : ride.status === 'ongoing' ? <button className="table-action" disabled={busyId === ride._id} onClick={() => onAction(ride, 'status', { status: 'completed' })}>Complete ride</button> : '—'}</td></tr>)}</tbody></table></div> : <div className="empty-state">Accepted and completed rides will appear here.</div>}
      </section>
    </div>
  )
}
