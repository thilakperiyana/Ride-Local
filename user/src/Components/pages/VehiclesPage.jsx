import { useEffect, useState } from 'react'
import MapRoutePicker from '../MapRoutePicker'
import { API } from '../api'

const maxPickupDistanceKm = Number(import.meta.env.VITE_MAX_PICKUP_DISTANCE_KM || 25)

function distanceKm(point, location) {
  const radians = (degrees) => degrees * Math.PI / 180
  const latitudeDelta = radians(Number(location.latitude) - point.latitude)
  const longitudeDelta = radians(Number(location.longitude) - point.longitude)
  const value = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(radians(point.latitude))
    * Math.cos(radians(Number(location.latitude)))
    * Math.sin(longitudeDelta / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value))
}

export default function VehiclesPage({ locations, categories, vehicles, pickup, destination, activeMapSelection, onMapSelect, onChangeMapSelection, pickupTime, setPickupTime, minimumPickupTime, busy, catalogReady, onBook }) {
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [bookingError, setBookingError] = useState('')
  const servedAreas = pickup
    ? new Set(locations
      .filter((location) => Number.isFinite(Number(location.latitude)) && Number.isFinite(Number(location.longitude)))
      .filter((location) => distanceKm(pickup, location) <= maxPickupDistanceKm)
      .map((location) => location.name))
    : null
  const availableVehicles = vehicles.filter((vehicle) => (
    (!servedAreas || servedAreas.has(vehicle.serviceLocation))
    && categories.some((category) => category.name === vehicle.category)
  ))
  const currentSelectedVehicle = selectedVehicle
    ? vehicles.find((vehicle) => vehicle._id === selectedVehicle._id) || selectedVehicle
    : null
  const pickupLabel = pickup?.address || 'Tap the map to choose a pickup'
  const destinationLabel = destination?.address || 'Tap the map to choose a drop-off'
  const canFindVehicles = Boolean(pickup && destination)

  useEffect(() => {
    if (!selectedVehicle) return undefined
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setSelectedVehicle(null)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [selectedVehicle])

  function showVehicles(event) {
    event.preventDefault()
    if (!canFindVehicles) return
    document.getElementById('available-vehicles')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  async function bookSelectedVehicle(event) {
    if (!currentSelectedVehicle) return
    setBookingError('')
    const result = await onBook(event, currentSelectedVehicle.category, currentSelectedVehicle._id)
    if (result === true) {
      setSelectedVehicle(null)
    } else if (typeof result === 'string') {
      setBookingError(result)
    }
  }

  return <>
    <section className="booking-section">
      <div className="section-kicker">A BETTER WAY AROUND</div>
      <div className="booking-heading"><div><h2>Where to today?</h2><p>Choose your pickup and drop-off directly on the map.</p></div><span className="step-label"><b>01</b> / 02</span></div>
      <div className="route-point-summary">
        <div className={activeMapSelection === 'pickup' ? 'route-point selected' : 'route-point'}>
          <span className="route-point-marker pickup-marker">P</span>
          <span><small>PICKUP</small><strong>{pickupLabel}</strong></span>
          <button type="button" onClick={() => onChangeMapSelection('pickup')}>Change</button>
        </div>
        <span className="route-point-connector" aria-hidden="true" />
        <div className={activeMapSelection === 'destination' ? 'route-point selected' : 'route-point'}>
          <span className="route-point-marker destination-marker">D</span>
          <span><small>DROP-OFF</small><strong>{destinationLabel}</strong></span>
          <button type="button" onClick={() => onChangeMapSelection('destination')}>Change</button>
        </div>
      </div>
      <MapRoutePicker locations={locations} pickup={pickup} destination={destination} activeSelection={activeMapSelection} onSelect={onMapSelect} onChangeSelection={onChangeMapSelection} />
      <div className="booking-options">
        <label className="pickup-time" htmlFor="ride-pickup-time">RIDE DATE &amp; TIME
          <input id="ride-pickup-time" type="datetime-local" value={pickupTime} min={minimumPickupTime} required onChange={(event) => setPickupTime(event.target.value)} />
        </label>
        <button className="button search-button" type="button" onClick={showVehicles} disabled={!canFindVehicles}>See available rides <span>→</span></button>
      </div>
      <p className="map-service-note">Ride availability is shown for supported pickup areas within {maxPickupDistanceKm} km.</p>
    </section>

    <section className="vehicle-section" id="available-vehicles">
      <div className="section-top"><div><span className="section-kicker">YOUR KIND OF RIDE</span><h2>Choose your vehicle.</h2><p className="vehicle-section-note">{pickup ? `Vehicles serving ${pickup.address}` : 'Select a pickup point to check nearby vehicles.'}</p></div></div>
      <div className="vehicle-grid">{availableVehicles.map((vehicle) => {
        const category = categories.find((item) => item.name === vehicle.category)
        const categoryIndex = Math.max(0, categories.indexOf(category))
        const symbol = ['🚕', '🚘', '🚙', '🛺'][categoryIndex % 4]
        const style = ['standard', 'comfort', 'suv', 'auto'][categoryIndex % 4]
        return <article className="vehicle-card" key={vehicle._id}>
          <div className={`vehicle-art vehicle-${style}`}>{vehicle.hasImage ? <img className="vehicle-photo" src={`${API}/catalog/vehicles/${vehicle._id}/image?v=${encodeURIComponent(vehicle.updatedAt || '')}`} alt={`${vehicle.vehicleModel || vehicle.vehicleName || category.name}`} /> : <span className="vehicle-symbol">{symbol}</span>}<span className="capacity">{vehicle.seats || 4} seats</span>{vehicle.isAvailable === false && <span className="vehicle-availability-label">Not available</span>}<span className="vehicle-orbit" /></div>
          <div className="vehicle-info"><span className="vehicle-type">{category.name.toUpperCase()}</span><h3>{vehicle.vehicleModel || vehicle.vehicleName || category.name}</h3>
            <p>{vehicle.vehicleModel || category.description || 'A local ride for your neighborhood trip.'}</p>
            <small className="fleet-line">{vehicle.vehicleNumber} · {vehicle.driverId?.name || 'Local driver'} · {vehicle.serviceLocation}</small>
            <div className="vehicle-bottom"><span className="fare">₹{Number(category.pricePerKm || 0).toFixed(2)}<small> / km est.</small></span><button className="icon-button" type="button" aria-label={`View ${vehicle.vehicleModel || vehicle.vehicleName || category.name} details`} onClick={() => { setBookingError(''); setSelectedVehicle(vehicle) }}>↗</button></div>
          </div>
        </article>
      })}</div>
      {availableVehicles.length === 0 && <div className="empty-state"><h3>{!catalogReady ? 'Loading local vehicles…' : pickup ? 'No vehicles serve this pickup area yet' : 'Choose your pickup on the map'}</h3><p>{pickup ? 'Try moving the pickup point closer to a supported service area.' : 'Available vehicles will appear here after you select your pickup.'}</p></div>}
    </section>
    {selectedVehicle && (() => {
      const vehicle = currentSelectedVehicle
      const category = categories.find((item) => item.name === vehicle.category)
      const imageUrl = `${API}/catalog/vehicles/${vehicle._id}/image?v=${encodeURIComponent(vehicle.updatedAt || '')}`
      return <div className="vehicle-detail-backdrop" onMouseDown={(event) => {
        if (event.target === event.currentTarget) setSelectedVehicle(null)
      }}>
        <section className="vehicle-detail-dialog" role="dialog" aria-modal="true" aria-labelledby="vehicle-detail-title">
      <button type="button" className="vehicle-detail-close" aria-label="Close vehicle details" onClick={() => setSelectedVehicle(null)}>×</button>
      {vehicle.hasImage
        ? <img className="vehicle-detail-image" src={imageUrl} alt={vehicle.vehicleModel || vehicle.vehicleName || 'Vehicle'} />
        : <div className="vehicle-detail-placeholder" aria-hidden="true">🚘</div>}
      <div className="vehicle-detail-content">
        <span className="vehicle-type">{vehicle.category.toUpperCase()}</span>
        <h2 id="vehicle-detail-title">{vehicle.vehicleModel || vehicle.vehicleName || vehicle.category}</h2>
        <p>{category?.description || 'A local ride for your neighborhood trip.'}</p>
        <dl className="vehicle-detail-facts">
          <div><dt>Vehicle number</dt><dd>{vehicle.vehicleNumber}</dd></div>
          <div><dt>Driver</dt><dd>{vehicle.driverId?.name || 'Local driver'}</dd></div>
          <div><dt>Service location</dt><dd>{vehicle.serviceLocation}</dd></div>
          <div><dt>Colour</dt><dd>{vehicle.colour || 'Not listed'}</dd></div>
          <div><dt>Seats</dt><dd>{vehicle.seats || 4}</dd></div>
          <div><dt>Estimated rate</dt><dd>₹{Number(category?.pricePerKm || 0).toFixed(2)} / km</dd></div>
        </dl>
        {vehicle.isAvailable === false
          ? <p className="vehicle-detail-prompt">This vehicle is currently booked or unavailable.</p>
          : !canFindVehicles && <p className="vehicle-detail-prompt">Choose pickup and drop-off points on the map before booking.</p>}
        {bookingError && <p className="vehicle-detail-error" role="alert">{bookingError}</p>}
        <button type="button" className="button vehicle-detail-book" disabled={busy || vehicle.isAvailable === false} onClick={bookSelectedVehicle}>
          {busy ? 'Requesting ride…' : vehicle.isAvailable === false ? 'Not available' : 'Book this ride'}
            </button>
          </div>
        </section>
      </div>
    })()}
  </>
}
