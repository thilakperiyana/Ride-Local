import Panel from '../components/Panel'

const money = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(value || 0))

export default function CategoriesPage({ categories, value, setValue, onSubmit, onRemove }) {
  const update = (key, next) => setValue((current) => ({ ...current, [key]: next }))
  return (
    <Panel eyebrow="RIDE OPTIONS" title="Vehicle categories" count={`${categories.length} categories`}>
      <form className="admin-form category-form" onSubmit={onSubmit}>
        <label>Category name<input maxLength="80" required value={value.name} onChange={(event) => update('name', event.target.value)} placeholder="Category name" /></label>
        <label>Description<input maxLength="200" value={value.description} onChange={(event) => update('description', event.target.value)} placeholder="Short description" /></label>
        <div className="form-row"><label className="price-input"><span>₹</span><input type="number" min="0" step="0.01" required value={value.pricePerKm} onChange={(event) => update('pricePerKm', event.target.value)} placeholder="Price per km" /></label><button type="submit">+ Add category</button></div>
      </form>
      <div className="manage-list">{categories.map((item) => <div key={item._id}>
        <span className="list-icon">▤</span><span><b>{item.name}</b><small>{item.description || 'Vehicle option'} · {money(item.pricePerKm)}/km</small></span>
        <button className="admin-remove" onClick={() => onRemove(item)}>Remove</button>
      </div>)}</div>
    </Panel>
  )
}
