export default function DriversPage({ drivers }) {
  return <section className="dashboard-section page-section">
    <div className="section-top"><div><span className="section-kicker">PEOPLE BEHIND THE WHEEL</span><h2>Meet local drivers.</h2></div></div>
    {drivers.length ? <div className="driver-grid">{drivers.map((driver) => <article className="driver-card" key={driver._id}><span className="account-avatar">{driver.name?.[0]?.toUpperCase()}</span><div><span className="vehicle-type">APPROVED DRIVER</span><h3>{driver.name}</h3><p>Verified for the local ride network</p></div></article>)}</div> : <div className="empty-state"><p>Approved local drivers will appear here.</p></div>}
  </section>
}
