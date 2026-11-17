import Panel from '../components/Panel'
import StatusBadge from '../components/StatusBadge'

export default function FleetPage({ vehicles }) {
  return (
    <Panel eyebrow="FLEET OVERVIEW" title="Registered vehicles" count={`${vehicles.length} total`}>
      {vehicles.length ? <div className="table-scroll"><table><thead><tr><th>VEHICLE</th><th>REGISTRATION</th><th>CATEGORY</th><th>DRIVER</th><th>SERVICE AREA</th><th>AVAILABILITY</th></tr></thead><tbody>
        {vehicles.map((vehicle) => <tr key={vehicle._id}>
          <td><b>{vehicle.vehicleModel || vehicle.vehicleName || 'Vehicle'}</b><small>{vehicle.colour || 'Colour not listed'} · {vehicle.seats} seats</small></td>
          <td>{vehicle.vehicleNumber}</td><td>{vehicle.category}</td><td>{vehicle.driverId?.name || 'Driver'}</td><td>{vehicle.serviceLocation}</td>
          <td><StatusBadge>{vehicle.isBooked ? 'booked' : vehicle.isAvailable === false ? 'unavailable' : 'available'}</StatusBadge></td>
        </tr>)}
      </tbody></table></div> : <div className="admin-empty">No vehicles registered yet.</div>}
    </Panel>
  )
}
