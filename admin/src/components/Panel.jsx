export default function Panel({ eyebrow, title, count, children, className = '' }) {
  return (
    <section className={`admin-panel ${className}`}>
      <div className="panel-heading">
        <div><span className="admin-eyebrow">{eyebrow}</span><h2>{title}</h2></div>
        {count !== undefined && <span className="panel-count">{count}</span>}
      </div>
      {children}
    </section>
  )
}
