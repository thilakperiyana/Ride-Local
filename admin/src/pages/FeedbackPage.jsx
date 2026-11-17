import Panel from '../components/Panel'

export default function FeedbackPage({ feedback }) {
  const average = feedback.length ? feedback.reduce((sum, item) => sum + Number(item.rating || 0), 0) / feedback.length : 0
  return (
    <Panel eyebrow="RIDER EXPERIENCE" title="Customer feedback" count={`${feedback.length} reviews`}>
      {feedback.length ? <>
        <div className="admin-rating-summary"><strong>{average.toFixed(1)}</strong><span>★</span><small>Average rider rating</small></div>
        <div className="manage-list">{feedback.map((item) => <article className="admin-review" key={item._id}>
          <span className="list-icon">★</span><div><b>{item.customerId?.name || 'Rider'} <span className="review-stars">{'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}</span></b>
            <small>{item.bookingId?.pickup || 'Ride'} → {item.bookingId?.destination || ''} · driver {item.driverId?.name || '—'}</small>
            <p>{item.comment || 'No written comment.'}</p><small>{new Date(item.createdAt).toLocaleDateString('en-IN')}</small>
          </div>
        </article>)}</div>
      </> : <div className="admin-empty">Customer reviews will appear here after completed rides.</div>}
    </Panel>
  )
}
