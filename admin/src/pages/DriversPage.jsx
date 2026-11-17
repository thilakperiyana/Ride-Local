import Panel from '../components/Panel'
import StatusBadge from '../components/StatusBadge'

export default function DriversPage({ drivers, pending, onUpdate }) {
  return (
    <Panel eyebrow="PEOPLE ON THE ROAD" title="Driver applications" count={`${pending} awaiting review`}>
      {drivers.length === 0 ? <div className="admin-empty">No driver applications yet.</div> : <div className="table-scroll"><table><thead><tr><th>DRIVER</th><th>PHONE</th><th>LICENCE</th><th>APPLIED</th><th>STATUS</th><th>ACTIONS</th></tr></thead><tbody>
        {drivers.map((driver) => <tr key={driver._id}>
          <td><b>{driver.name}</b><small>{driver.email}</small></td><td>{driver.phone}</td><td>{driver.licenseNumber || '—'}</td>
          <td>{new Date(driver.createdAt).toLocaleDateString('en-IN')}</td><td><StatusBadge>{driver.driverStatus}</StatusBadge></td>
          <td><div className="action-buttons">
            {driver.driverStatus !== 'approved' && <button className="approve" onClick={() => onUpdate(driver, 'approved')}>Approve</button>}
            {driver.driverStatus !== 'rejected' && <button className="reject" onClick={() => onUpdate(driver, 'rejected')}>Reject</button>}
          </div></td>
        </tr>)}
      </tbody></table></div>}
    </Panel>
  )
}
