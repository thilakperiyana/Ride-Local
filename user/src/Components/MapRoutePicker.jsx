import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const initialCenter = [12.9141, 74.856]

function createPointIcon(label, kind) {
  return L.divIcon({
    className: `map-point-icon map-point-${kind}`,
    html: `<span>${label}</span>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  })
}

export default function MapRoutePicker({ locations, pickup, destination, activeSelection, onSelect, onChangeSelection }) {
  const mapElement = useRef(null)
  const mapInstance = useRef(null)
  const pickupMarker = useRef(null)
  const destinationMarker = useRef(null)
  const routeLine = useRef(null)
  const onSelectRef = useRef(onSelect)
  const activeSelectionRef = useRef(activeSelection)
  const [tileError, setTileError] = useState(false)

  useEffect(() => {
    onSelectRef.current = onSelect
  }, [onSelect])

  useEffect(() => {
    activeSelectionRef.current = activeSelection
  }, [activeSelection])

  useEffect(() => {
    const map = L.map(mapElement.current, { scrollWheelZoom: false }).setView(initialCenter, 13)
    mapInstance.current = map
    const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map)
    tiles.on('tileerror', () => setTileError(true))
    map.on('click', (event) => {
      onSelectRef.current({
        latitude: Number(event.latlng.lat.toFixed(6)),
        longitude: Number(event.latlng.lng.toFixed(6)),
      }, activeSelectionRef.current)
    })

    return () => {
      map.remove()
      mapInstance.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapInstance.current
    if (!map || !locations.length || pickup || destination) return
    const location = locations.find((place) => Number.isFinite(Number(place.latitude)) && Number.isFinite(Number(place.longitude)))
    if (location) map.setView([Number(location.latitude), Number(location.longitude)], 13)
  }, [locations, pickup, destination])

  useEffect(() => {
    const map = mapInstance.current
    if (!map) return

    const updateMarker = (point, markerRef, label, kind) => {
      if (!point) {
        if (markerRef.current) markerRef.current.remove()
        markerRef.current = null
        return null
      }
      const position = [point.latitude, point.longitude]
      if (!markerRef.current) {
        markerRef.current = L.marker(position, { icon: createPointIcon(label, kind), keyboard: true }).addTo(map)
      } else {
        markerRef.current.setLatLng(position)
      }
      return position
    }

    const pickupPosition = updateMarker(pickup, pickupMarker, 'P', 'pickup')
    const destinationPosition = updateMarker(destination, destinationMarker, 'D', 'destination')
    if (pickupPosition && destinationPosition) {
      const route = [pickupPosition, destinationPosition]
      if (!routeLine.current) routeLine.current = L.polyline(route, { color: '#236c50', weight: 4, dashArray: '8 8' }).addTo(map)
      else routeLine.current.setLatLngs(route)
      map.fitBounds(route, { padding: [45, 45], maxZoom: 15 })
    } else {
      if (routeLine.current) routeLine.current.remove()
      routeLine.current = null
      const selectedPosition = pickupPosition || destinationPosition
      if (selectedPosition) map.panTo(selectedPosition)
    }
    window.setTimeout(() => map.invalidateSize(), 0)
  }, [pickup, destination])

  return <div className="map-route-picker">
    <div className="map-selection-controls" role="group" aria-label="Choose which point to place on the map">
      <button type="button" className={activeSelection === 'pickup' ? 'active' : ''} onClick={() => onChangeSelection('pickup')}>① Set pickup</button>
      <button type="button" className={activeSelection === 'destination' ? 'active' : ''} onClick={() => onChangeSelection('destination')}>② Set drop-off</button>
    </div>
    <p className="map-instructions">Choose a point above, then tap the map. Select the other point and tap again.</p>
    <div className="map-canvas" ref={mapElement} aria-label="Map for choosing pickup and drop-off points" />
    {tileError && <p className="map-error" role="status">Map tiles could not load. Check your connection and try again.</p>}
  </div>
}
