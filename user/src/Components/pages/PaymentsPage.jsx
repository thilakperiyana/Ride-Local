const money = (value) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
}).format(Number(value || 0))

export default function PaymentsPage({ role, rides, payments, driverPayments, driverShare, paymentChoice, setPaymentChoice, onPay }) {
  if (role === 'driver') {
    return <section className="dashboard-section page-section">
      <div className="section-top"><div><span className="section-kicker">DRIVER EARNINGS</span><h2>Payment share.</h2></div></div>
      <div className="driver-share-card"><span>PAID DRIVER SHARE</span><b>{money(driverShare)}</b><small>Only completed cash payments count as paid in this demo.</small></div>
      {driverPayments.map((payment) => <article className="ride-row" key={payment._id}><span className="ride-route-icon">₹</span><div className="ride-route"><b>{payment.bookingId?.pickup} → {payment.bookingId?.destination}</b><small>{money(payment.driverShare)} share · {payment.paymentMethod} · {payment.status}</small></div></article>)}
    </section>
  }

  const completedRides = rides.filter((ride) => ride.status === 'completed')
  const paymentFor = (rideId) => payments.find((payment) => (payment.bookingId?._id || payment.bookingId) === rideId)

  return <section className="dashboard-section page-section">
    <div className="section-top"><div><span className="section-kicker">CUSTOMER PAYMENTS</span><h2>Completed ride payments.</h2></div></div>
    {completedRides.length === 0 ? <div className="empty-state"><p>Payment options will appear when a ride is completed.</p></div>
      : completedRides.map((ride) => {
        const payment = paymentFor(ride._id)
        const paid = payment?.status === 'paid'
        return <article className="ride-row ride-row-wrap" key={ride._id}>
          <span className="ride-route-icon">₹</span>
          <div className="ride-route"><b>{ride.pickup} → {ride.destination}</b><small>Fare {money(ride.estimatedFare)} · approx. {ride.travellingDuration || 0} minutes</small></div>
          {paid ? <span className="status status-completed">paid · {payment.paymentMethod}</span> : <>
            <select aria-label="Payment method" value={paymentChoice[ride._id] || 'Cash'} onChange={(event) => setPaymentChoice({ ...paymentChoice, [ride._id]: event.target.value })}><option value="Cash">Cash</option><option value="Card">Card (demo)</option><option value="UPI">UPI (demo)</option></select>
            <button className="button button-small" onClick={() => onPay(ride)}>Record payment</button>
            {payment?.status === 'pending' && <span className="status status-pending">not charged · pending</span>}
          </>}
        </article>
      })}
    <p className="auth-footnote">Cash payments are recorded as paid. Demo Card/UPI are not charged and remain pending.</p>
  </section>
}
