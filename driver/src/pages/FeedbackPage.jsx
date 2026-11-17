const stars = (rating) => `${'★'.repeat(Number(rating || 0))}${'☆'.repeat(5 - Number(rating || 0))}`

export default function FeedbackPage({ feedback }) {
  const average = feedback.length ? feedback.reduce((total, item) => total + Number(item.rating || 0), 0) / feedback.length : 0
  return (
    <div className="page-stack">
      <div className="page-heading"><span className="section-kicker">CUSTOMER FEEDBACK</span><h1>Rider reviews</h1><p>Read the ratings and comments customers shared after their rides.</p></div>
      <section className="feedback-summary panel"><span className="rating-star">★</span><b>{average ? average.toFixed(1) : '—'}</b><span>{feedback.length} review{feedback.length === 1 ? '' : 's'}</span></section>
      {feedback.length ? <div className="feedback-list">{feedback.map((item) => <article className="panel feedback-card" key={item._id}><div className="feedback-top"><span className="avatar">{item.customerId?.name?.[0]?.toUpperCase() || 'R'}</span><div><b>{item.customerId?.name || 'Rider'}</b><small>{item.bookingId?.pickup || 'Ride'} → {item.bookingId?.destination || ''}</small></div><span className="feedback-date">{new Date(item.createdAt).toLocaleDateString()}</span></div><div className="rating-stars" aria-label={`${item.rating} out of 5 stars`}>{stars(item.rating)}</div><p>{item.comment || 'No written comment.'}</p></article>)}</div> : <section className="panel empty-state">Customer feedback will appear here after completed rides are reviewed.</section>}
    </div>
  )
}
