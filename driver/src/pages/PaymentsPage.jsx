import StatusBadge from '../components/StatusBadge'

const money = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(value || 0))

export default function PaymentsPage({ payments, totalShare }) {
  return (
    <div className="page-stack">
      <div className="page-heading"><span className="section-kicker">PAYMENT MANAGEMENT</span><h1>Payments & driver share</h1><p>Review ride amounts, payment status, and your share history.</p></div>
      <div className="payment-summary">
        <article className="panel payment-total"><span className="section-kicker">TOTAL PAID DRIVER SHARE</span><b>{money(totalShare)}</b><small>Calculated from paid customer payments</small></article>
        <article className="panel share-explainer"><span className="section-kicker">AUTOMATIC SHARE CALCULATION</span><h2>Ride amount = driver share + admin commission</h2><p>Each payment shows the full ride amount, your share, and the platform commission. The configured driver share percentage is applied automatically.</p></article>
      </div>
      <section className="panel"><div className="panel-heading"><div><span className="section-kicker">PAYMENT HISTORY</span><h2>Completed ride payments</h2></div></div>
        {payments.length ? <div className="table-wrap"><table><thead><tr><th>RIDE</th><th>RIDE AMOUNT</th><th>DRIVER SHARE</th><th>ADMIN COMMISSION</th><th>METHOD / DATE</th><th>STATUS</th></tr></thead><tbody>{payments.map((payment) => <tr key={payment._id}><td><b>{payment.bookingId?.pickup || 'Ride'} → {payment.bookingId?.destination || ''}</b></td><td>{money(payment.amount)}</td><td className="money-cell">{money(payment.driverShare)}</td><td>{money(payment.platformShare)}</td><td>{payment.paymentMethod}<small>{new Date(payment.paymentDate).toLocaleDateString()}</small></td><td><StatusBadge>{payment.status}</StatusBadge></td></tr>)}</tbody></table></div> : <div className="empty-state">Ride payments will appear here after customers complete payment.</div>}
      </section>
    </div>
  )
}
