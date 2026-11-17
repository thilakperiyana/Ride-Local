import Panel from '../components/Panel'
import StatusBadge from '../components/StatusBadge'

const money = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(value || 0))

export default function BookingsPage({ bookings }) {
  return (
    <Panel eyebrow="SERVICE ACTIVITY" title="Ride requests & duration" count={`${bookings.length} recent`}>
      {bookings.length ? <div className="table-scroll"><table><thead><tr><th>ROUTE</th><th>CUSTOMER</th><th>DRIVER</th><th>CATEGORY</th><th>DISTANCE</th><th>DURATION</th><th>FARE</th><th>STATUS</th></tr></thead><tbody>
        {bookings.map((booking) => <tr key={booking._id}>
          <td><b>{booking.pickup} → {booking.destination}</b><small>{new Date(booking.pickupTime || booking.createdAt).toLocaleString('en-IN')}</small></td>
          <td>{booking.customerId?.name || '—'}</td><td>{booking.driverId?.name || 'Unassigned'}</td>
          <td>{booking.vehicleCategory}</td><td>{Number(booking.distanceKm || 0).toFixed(1)} km</td><td>{booking.travellingDuration || 0} min</td>
          <td>{money(booking.estimatedFare)}</td><td><StatusBadge>{booking.status}</StatusBadge></td>
        </tr>)}
      </tbody></table></div> : <div className="admin-empty">Ride requests and duration estimates will appear here.</div>}
    </Panel>
  )
}
