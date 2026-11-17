import Panel from '../components/Panel'

export default function LocationsPage({ locations, value, setValue, onSubmit, onRemove }) {
  const update = (key, next) => setValue((current) => ({ ...current, [key]: next }))
  return (
    <Panel eyebrow="SERVICE AREAS" title="Pickup locations" count={`${locations.length} active`}>
      <form className="admin-form" onSubmit={onSubmit}>
        <label>Neighborhood / area<input maxLength="100" required value={value.name} onChange={(event) => update('name', event.target.value)} placeholder="Neighborhood / area" /></label>
        <div className="form-row"><label>City<input maxLength="80" value={value.city} onChange={(event) => update('city', event.target.value)} placeholder="City" /></label><label>State<input maxLength="80" value={value.state} onChange={(event) => update('state', event.target.value)} placeholder="State" /></label></div>
        <div className="form-row"><label>Latitude<input type="number" step="any" min="-90" max="90" value={value.latitude} onChange={(event) => update('latitude', event.target.value)} placeholder="Optional" /></label><label>Longitude<input type="number" step="any" min="-180" max="180" value={value.longitude} onChange={(event) => update('longitude', event.target.value)} placeholder="Optional" /></label></div>
        <small>Add both coordinates for route-based fare and duration estimates.</small>
        <button type="submit">+ Add location</button>
      </form>
      <div className="manage-list">{locations.map((item) => <div key={item._id}>
        <span className="list-icon">⌖</span><span><b>{item.name}</b><small>{[item.city, item.state].filter(Boolean).join(', ') || 'Local service area'}{Number.isFinite(item.latitude) ? ` · ${item.latitude}, ${item.longitude}` : ' · estimated route'}</small></span>
        <button className="admin-remove" onClick={() => onRemove(item)}>Remove</button>
      </div>)}</div>
    </Panel>
  )
}
