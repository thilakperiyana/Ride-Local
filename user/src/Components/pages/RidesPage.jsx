const pickupNotStarted = (ride) => Boolean(ride.pickupTime && new Date(ride.pickupTime).getTime() > Date.now())

export default function RidesPage({ session, rides, payments, feedback, trackingLocations, driverVehicles, sharingRideId, onRefresh, onRideAction, onToggleGps }) {
  const paymentFor = (rideId) => payments.find((payment) => (payment.bookingId?._id || payment.bookingId) === rideId)
  const feedbackFor = (rideId) => feedback.find((item) => (item.bookingId?._id || item.bookingId) === rideId)

  return <section className="dashboard-section page-section" id="dashboard">
    <div className="section-top"><div><span className="section-kicker">YOUR LOCAL TRIPS</span><h2>{session.user.role === 'driver' ? 'Driver requests & rides.' : 'Your rides, all here.'}</h2></div><button className="button button-outline" onClick={onRefresh}>↻ Refresh</button></div>
    {session.user.role === 'driver' && session.user.driverStatus !== 'approved'
      ? <div className="empty-state"><span>◷</span><h3>{session.user.driverStatus === 'rejected' ? 'Application not approved' : 'Application under review'}</h3><p>Your driver account is {session.user.driverStatus}. This page checks for admin approval automatically.</p></div>
      : rides.length === 0
        ? <div className="empty-state"><span>⌁</span><h3>{session.user.role === 'driver' && driverVehicles.length === 0 ? 'Add a vehicle to get started' : 'No trips just yet'}</h3><p>{session.user.role === 'driver' && driverVehicles.length === 0 ? 'Register a vehicle and its service area to receive matching ride requests.' : 'Your upcoming rides and requests will show up here.'}</p></div>
        : <div className="ride-list">{rides.map((ride) => <article className="ride-row ride-row-wrap" key={ride._id}>
          <span className="ride-route-icon">⌁</span>
          <div className="ride-route">
            <b>{ride.pickup} <span>→</span> {ride.destination}</b>
            <small>{ride.vehicleCategory} · {Number(ride.distanceKm || 0).toFixed(1)} km · about {ride.travellingDuration || 0} min · ₹{Number(ride.estimatedFare || 0).toFixed(2)} · {ride.pickupTime ? new Date(ride.pickupTime).toLocaleString() : new Date(ride.createdAt).toLocaleDateString()}</small>
            {session.user.role === 'customer' && ride.driverId && <small>Driver: {ride.driverId.name} · {ride.driverId.phone}</small>}
            {session.user.role === 'customer' && ['accepted', 'ongoing'].includes(ride.status) && <small>{trackingLocations[ride._id]
              ? <>Live location updated {new Date(trackingLocations[ride._id].updatedAt).toLocaleTimeString()} · <a target="_blank" rel="noreferrer" href={`https://www.openstreetmap.org/?mlat=${trackingLocations[ride._id].latitude}&mlon=${trackingLocations[ride._id].longitude}#map=16/${trackingLocations[ride._id].latitude}/${trackingLocations[ride._id].longitude}`}>Open map ↗</a></>
              : 'Waiting for driver to share GPS location…'}</small>}
            {session.user.role === 'customer' && ride.status === 'completed' && <small>Payment: {paymentFor(ride._id)?.status || 'not recorded'} · feedback: {feedbackFor(ride._id) ? 'sent' : 'not sent'}</small>}
          </div>
          {session.user.role === 'driver' && ride.isAvailable
            ? <><span className="status status-pending">open request</span><button className="button button-small" onClick={() => onRideAction(ride, 'accept')}>Accept</button><button className="text-button" onClick={() => onRideAction(ride, 'reject')}>Dismiss</button></>
            : <><span className={`status status-${ride.status}`}>{ride.status}</span>
              {session.user.role === 'driver' && ride.status === 'accepted' && <>
                {pickupNotStarted(ride) && <small>Scheduled pickup: {new Date(ride.pickupTime).toLocaleString()}</small>}
                <button className="button button-small" disabled={pickupNotStarted(ride)} title={pickupNotStarted(ride) ? 'This ride can only be started at its scheduled pickup time.' : undefined} onClick={() => onRideAction(ride, 'status', { status: 'ongoing' })}>Start ride</button>
              </>}
              {session.user.role === 'driver' && ride.status === 'ongoing' && <>
                <button className="button button-small" onClick={() => onToggleGps(ride)}>{sharingRideId === ride._id ? 'Stop GPS sharing' : 'Share live GPS'}</button>
                <button className="button button-small" onClick={() => onRideAction(ride, 'status', { status: 'completed' })}>Complete</button>
              </>}
            </>}
        </article>)}</div>}
  </section>
}
