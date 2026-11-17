export default function Notice({ error, notice, onDismiss }) {
  const message = error || notice
  if (!message) return null
  return (
    <div className={error ? 'admin-alert' : 'admin-notice'} role={error ? 'alert' : 'status'}>
      {message}<button onClick={onDismiss} aria-label="Dismiss message">×</button>
    </div>
  )
}
