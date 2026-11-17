import StatusBadge from '../components/StatusBadge'

export default function DriversPage({ drivers }) {
  return (
    <div className="page-stack">
      <div className="page-heading"><span className="section-kicker">LOCAL NETWORK</span><h1>Driver directory</h1><p>Registered drivers, their approval status, and vehicle details.</p></div>
      {drivers.length ? <div className="directory-grid">{drivers.map((driver) => <article className="panel directory-card" key={driver._id}><div className="directory-heading"><span className="avatar">{driver.name?.[0]?.toUpperCase() || 'D'}</span><div><h2>{driver.name}</h2><small>Joined {new Date(driver.createdAt).toLocaleDateString()}</small></div><StatusBadge>{driver.driverStatus}</StatusBadge></div><div className="directory-availability"><span>Vehicle availability</span><StatusBadge>{driver.availability}</StatusBadge></div>{driver.vehicles?.length ? <div className="directory-vehicles">{driver.vehicles.map((vehicle) => <div key={vehicle._id}><b>{vehicle.vehicleModel}</b><span>{vehicle.vehicleNumber} · {vehicle.category}</span><small>{vehicle.colour || 'Colour not listed'} · {vehicle.serviceLocation}</small></div>)}</div> : <p className="muted">No vehicle details listed.</p>}</article>)}</div> : <section className="panel empty-state">No approved drivers are available to display yet.</section>}
    </div>
  )
}
