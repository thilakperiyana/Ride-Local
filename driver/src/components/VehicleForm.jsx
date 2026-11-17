import { useEffect, useState } from 'react'

export default function VehicleForm({ value, setValue, categories, locations, vehicleBooked, existingImageUrl, onSubmit, onCancel, saving }) {
  const update = (field, nextValue) => setValue((current) => ({ ...current, [field]: nextValue }))
  const [previewUrl, setPreviewUrl] = useState(existingImageUrl)
  useEffect(() => {
    if (!value.vehicleImage) {
      setPreviewUrl(existingImageUrl)
      return undefined
    }
    const objectUrl = URL.createObjectURL(value.vehicleImage)
    setPreviewUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [value.vehicleImage, existingImageUrl])
  return (
    <form className="form-grid" onSubmit={onSubmit}>
      <label>Vehicle model<input required maxLength="80" value={value.vehicleModel} onChange={(event) => update('vehicleModel', event.target.value)} placeholder="e.g. Swift Dzire" /></label>
      <label>Vehicle number<input required maxLength="20" value={value.vehicleNumber} onChange={(event) => update('vehicleNumber', event.target.value.toUpperCase())} placeholder="KA 01 AB 1234" /></label>
      <label>Category<select required value={value.category} onChange={(event) => update('category', event.target.value)}><option value="">Select category</option>{categories.map((item) => <option key={item._id} value={item.name}>{item.name}</option>)}</select></label>
      <label>Service location<select required value={value.serviceLocation} onChange={(event) => update('serviceLocation', event.target.value)}><option value="">Select location</option>{locations.map((item) => <option key={item._id} value={item.name}>{item.name}</option>)}</select></label>
      <label>Colour<input required maxLength="40" value={value.colour} onChange={(event) => update('colour', event.target.value)} placeholder="White" /></label>
      <label>Seats<input type="number" min="1" max="20" required value={value.seats} onChange={(event) => update('seats', Number(event.target.value))} /></label>
      <label className="vehicle-image-field">Vehicle image<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => update('vehicleImage', event.target.files?.[0] || null)} /><small>Optional · JPG, PNG or WebP · up to 5 MB</small></label>
      {previewUrl && <div className="vehicle-image-preview"><img src={previewUrl} alt="Vehicle preview" /></div>}
      <label className="checkbox-label"><input type="checkbox" disabled={vehicleBooked} checked={value.isAvailable} onChange={(event) => update('isAvailable', event.target.checked)} /> Available for bookings{vehicleBooked && <small>Availability is locked while this vehicle has an active booking.</small>}</label>
      <div className="form-actions"><button className="primary-button" disabled={saving}>{saving ? 'Saving…' : 'Save vehicle'}</button>{onCancel && <button className="quiet-button" type="button" onClick={onCancel}>Cancel</button>}</div>
    </form>
  )
}
