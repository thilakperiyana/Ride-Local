export default function StatusBadge({ children }) {
  const status = String(children || 'unknown').toLowerCase().replaceAll(' ', '-')
  return <span className={`status-badge status-${status}`}>{children}</span>
}
