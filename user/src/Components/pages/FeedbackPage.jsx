export default function FeedbackPage({ role, rides, feedback, feedbackDraft, setFeedbackDraft, onSubmit }) {
  if (role === 'driver') {
    return <section className="dashboard-section page-section">
      <div className="section-top"><div><span className="section-kicker">CUSTOMER NOTES</span><h2>Feedback from riders.</h2></div></div>
      {feedback.length ? feedback.map((item) => <article className="ride-row" key={item._id}><span className="ride-route-icon">★</span><div className="ride-route"><b>{item.customerId?.name || 'Rider'} · {'★'.repeat(item.rating)}</b><small>{item.comment || 'No written comment'}</small></div></article>) : <div className="empty-state"><p>Rider feedback will appear here after completed trips.</p></div>}
    </section>
  }

  const completedRides = rides.filter((ride) => ride.status === 'completed')
  const existingReview = (rideId) => feedback.find((item) => (item.bookingId?._id || item.bookingId) === rideId)

  return <section className="dashboard-section page-section">
    <div className="section-top"><div><span className="section-kicker">RIDER EXPERIENCE</span><h2>Share your feedback.</h2></div></div>
    {completedRides.length === 0 ? <div className="empty-state"><p>You can review a ride after it is completed.</p></div>
      : completedRides.map((ride) => {
        const review = existingReview(ride._id)
        return <article className="ride-row ride-row-wrap" key={ride._id}>
          <span className="ride-route-icon">★</span>
          <div className="ride-route"><b>{ride.pickup} → {ride.destination}</b><small>{ride.vehicleCategory} · {ride.driverId?.name || 'Local driver'}</small></div>
          {review ? <span className="status status-completed">feedback sent ★{review.rating}</span> : <>
            <select aria-label="Feedback rating" value={feedbackDraft[ride._id]?.rating || 5} onChange={(event) => setFeedbackDraft({ ...feedbackDraft, [ride._id]: { ...feedbackDraft[ride._id], rating: Number(event.target.value) } })}><option value="5">★★★★★</option><option value="4">★★★★</option><option value="3">★★★</option><option value="2">★★</option><option value="1">★</option></select>
            <input aria-label="Feedback comment" placeholder="Share feedback" maxLength="1000" value={feedbackDraft[ride._id]?.comment || ''} onChange={(event) => setFeedbackDraft({ ...feedbackDraft, [ride._id]: { ...feedbackDraft[ride._id], comment: event.target.value } })} />
            <button className="button button-small" onClick={() => onSubmit(ride)}>Send feedback</button>
          </>}
        </article>
      })}
  </section>
}
