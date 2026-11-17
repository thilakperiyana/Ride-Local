export default function DriverVehiclesPage({ vehicleForm, setVehicleForm, categories, locations, driverVehicles, onSubmit, onRemove }) {
  return <section className="dashboard-section page-section">
    <div className="section-top"><div><span className="section-kicker">DRIVER FLEET</span><h2>Manage your vehicles.</h2></div></div>
    <form className="vehicle-form" onSubmit={onSubmit}>
      <input aria-label="Vehicle name" placeholder="Vehicle name" required value={vehicleForm.vehicleName} onChange={(event) => setVehicleForm({ ...vehicleForm, vehicleName: event.target.value })} />
      <input aria-label="Registration number" placeholder="Registration number" required value={vehicleForm.vehicleNumber} onChange={(event) => setVehicleForm({ ...vehicleForm, vehicleNumber: event.target.value })} />
      <select aria-label="Vehicle category" required value={vehicleForm.category} onChange={(event) => setVehicleForm({ ...vehicleForm, category: event.target.value })}><option value="">Category</option>{categories.map((item) => <option key={item._id} value={item.name}>{item.name}</option>)}</select>
      <select aria-label="Service location" required value={vehicleForm.serviceLocation} onChange={(event) => setVehicleForm({ ...vehicleForm, serviceLocation: event.target.value })}><option value="">Service location</option>{locations.map((place) => <option key={place._id} value={place.name}>{place.name}</option>)}</select>
      <input aria-label="Seats" type="number" min="1" max="20" value={vehicleForm.seats} onChange={(event) => setVehicleForm({ ...vehicleForm, seats: Number(event.target.value) })} />
      <button className="button">Add vehicle</button>
    </form>
    <div className="ride-list">{driverVehicles.map((vehicle) => <article className="ride-row" key={vehicle._id}><span className="ride-route-icon">🚘</span><div className="ride-route"><b>{vehicle.vehicleName} · {vehicle.vehicleNumber}</b><small>{vehicle.category} · {vehicle.seats} seats · {vehicle.serviceLocation}</small></div><button className="text-button" onClick={() => onRemove(vehicle._id)}>Remove</button></article>)}</div>
  </section>
}
