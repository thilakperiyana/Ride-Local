import Panel from '../components/Panel'
import StatusBadge from '../components/StatusBadge'

const money = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(value || 0))

export default function PaymentsPage({ payments, collected, driverPayouts }) {
  return (
    <>
      <div className="admin-payment-summary">
        <article className="admin-panel"><span className="admin-eyebrow">PAID RIDE AMOUNT</span><b>{money(collected)}</b><small>Recorded customer payments</small></article>
        <article className="admin-panel"><span className="admin-eyebrow">DRIVER PAYOUTS</span><b>{money(driverPayouts)}</b><small>Driver share of paid rides</small></article>
        <article className="admin-panel"><span className="admin-eyebrow">PAYMENT RECORDS</span><b>{payments.length}</b><small>Paid and pending transactions</small></article>
      </div>
      <Panel eyebrow="TRIP REVENUE" title="Payment history" count={`${payments.length} records`}>
        {payments.length ? <div className="table-scroll"><table><thead><tr><th>RIDE</th><th>CUSTOMER</th><th>DRIVER</th><th>METHOD</th><th>AMOUNT</th><th>DRIVER SHARE</th><th>ADMIN SHARE</th><th>STATUS</th></tr></thead><tbody>
          {payments.map((payment) => <tr key={payment._id}>
            <td><b>{payment.bookingId?.pickup || 'Ride'} → {payment.bookingId?.destination || ''}</b><small>{new Date(payment.paymentDate).toLocaleDateString('en-IN')}</small></td>
            <td>{payment.bookingId?.customerId?.name || 'Customer'}</td><td>{payment.bookingId?.driverId?.name || '—'}</td>
            <td>{payment.paymentMethod}</td><td>{money(payment.amount)}</td><td>{money(payment.driverShare)}</td><td>{money(payment.platformShare)}</td><td><StatusBadge>{payment.status}</StatusBadge></td>
          </tr>)}
        </tbody></table></div> : <div className="admin-empty">Payment records will appear here after rides are paid.</div>}
        <p className="admin-footnote">Card and UPI entries are demo-only and remain pending; cash entries are recorded as paid.</p>
      </Panel>
    </>
  )
}
