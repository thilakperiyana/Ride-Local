export default function Notice({ error, notice, onDismiss }) {
  const message = error || notice
  if (!message) return null
  return (
    <div className={`notice ${error ? 'notice-error' : 'notice-success'}`} role={error ? 'alert' : 'status'}>
      <span>{message}</span>
      <button onClick={onDismiss} aria-label="Dismiss message">×</button>
    </div>
  )
}
