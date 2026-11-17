export default function LoginPage({ form, setForm, onSubmit, onRegister, busy }) {
  return (
    <section className="auth-page">
      <div className="auth-aside">
        <a className="brand" href="/"><span className="brand-mark">R</span><span>ride<span className="brand-local">local</span></span></a>
        <span className="eyebrow">YOUR LOCAL DRIVER NETWORK</span>
        <h1>Good work.<br /><em>Good rides.</em></h1>
        <p>Manage your rides, vehicles, and earnings in one place.</p>
        <div className="auth-highlights"><span>✓ Flexible local bookings</span><span>✓ Clear earnings and ride history</span><span>✓ Support from your community</span></div>
      </div>
      <div className="auth-card">
        <span className="section-kicker">WELCOME BACK</span>
        <h2>Driver sign in</h2>
        <p className="muted">Use your registered email and password.</p>
        <form onSubmit={onSubmit} className="stack-form">
          <label>Email address<input required type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
          <label>Password<input required type="password" autoComplete="current-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label>
          <button className="primary-button full-button" disabled={busy}>{busy ? 'Signing in…' : 'Sign in to your dashboard'}</button>
        </form>
        <p className="auth-switch">New to Ride Local? <button onClick={onRegister}>Apply as a driver</button></p>
      </div>
    </section>
  )
}
