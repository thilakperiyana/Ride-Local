export default function StatusBadge({ children }) {
  const status = String(children || 'unknown').toLowerCase().replaceAll('_', '-')
  return <span className={`driver-state state-${status}`}>{String(children || 'unknown').replaceAll('_', ' ')}</span>
}
