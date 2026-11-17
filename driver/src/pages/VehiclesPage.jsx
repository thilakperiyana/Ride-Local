import { useState } from 'react'
import StatusBadge from '../components/StatusBadge'
import VehicleForm from '../components/VehicleForm'

const emptyVehicle = () => ({ vehicleModel: '', vehicleNumber: '', category: '', serviceLocation: '', colour: '', seats: 4, isAvailable: true, vehicleImage: null })

export default function VehiclesPage({ vehicles, categories, locations, imageBaseUrl, onSave, onDelete, saving }) {
  const [form, setForm] = useState(emptyVehicle())
  const [editingId, setEditingId] = useState('')
  const edit = (vehicle) => {
    setEditingId(vehicle._id)
    setForm({ vehicleModel: vehicle.vehicleModel || vehicle.vehicleName || '', vehicleNumber: vehicle.vehicleNumber || '', category: vehicle.category || '', serviceLocation: vehicle.serviceLocation || '', colour: vehicle.colour || '', seats: vehicle.seats || 4, isAvailable: vehicle.isAvailable !== false, vehicleImage: null })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const cancel = () => { setEditingId(''); setForm(emptyVehicle()) }
  const submit = async (event) => {
    event.preventDefault()
    const saved = await onSave(form, editingId)
    if (saved) cancel()
  }
  return (
    <div className="page-stack">
      <div className="page-heading"><span className="section-kicker">YOUR FLEET</span><h1>Manage vehicles</h1><p>Add vehicles for your service locations and keep availability up to date.</p></div>
      <section className="panel"><div className="panel-heading"><div><span className="section-kicker">{editingId ? 'UPDATE VEHICLE' : 'ADD TO YOUR FLEET'}</span><h2>{editingId ? 'Edit vehicle details' : 'Vehicle information'}</h2></div></div><VehicleForm key={editingId || 'new'} value={form} setValue={setForm} categories={categories} locations={locations} vehicleBooked={Boolean(vehicles.find((vehicle) => vehicle._id === editingId)?.isBooked)} existingImageUrl={editingId && vehicles.find((vehicle) => vehicle._id === editingId)?.hasImage ? `${imageBaseUrl}/catalog/vehicles/${editingId}/image?v=${encodeURIComponent(vehicles.find((vehicle) => vehicle._id === editingId)?.updatedAt || '')}` : ''} onSubmit={submit} onCancel={editingId ? cancel : null} saving={saving} /></section>
      <section className="panel"><div className="panel-heading"><div><span className="section-kicker">REGISTERED VEHICLES</span><h2>Your fleet <span className="count-pill">{vehicles.length}</span></h2></div></div>
        {vehicles.length ? <div className="table-wrap"><table><thead><tr><th>IMAGE</th><th>VEHICLE</th><th>NUMBER</th><th>CATEGORY / LOCATION</th><th>COLOUR / SEATS</th><th>AVAILABILITY</th><th>ACTIONS</th></tr></thead><tbody>{vehicles.map((vehicle) => <tr key={vehicle._id}><td>{vehicle.hasImage ? <img className="vehicle-image-thumb" src={`${imageBaseUrl}/catalog/vehicles/${vehicle._id}/image?v=${encodeURIComponent(vehicle.updatedAt || '')}`} alt={`${vehicle.vehicleModel || vehicle.vehicleName} vehicle`} /> : <span className="vehicle-image-placeholder">No image</span>}</td><td><b>{vehicle.vehicleModel || vehicle.vehicleName}</b></td><td>{vehicle.vehicleNumber}</td><td>{vehicle.category}<small>{vehicle.serviceLocation}</small></td><td>{vehicle.colour || '—'} · {vehicle.seats} seats</td><td><StatusBadge>{vehicle.isBooked ? 'booked' : vehicle.isAvailable === false ? 'unavailable' : 'available'}</StatusBadge></td><td className="row-actions"><button className="table-action" onClick={() => edit(vehicle)}>Edit</button><button className="danger-link" onClick={() => onDelete(vehicle._id)}>Delete</button></td></tr>)}</tbody></table></div> : <div className="empty-state">No vehicles registered yet.</div>}
      </section>
    </div>
  )
}
