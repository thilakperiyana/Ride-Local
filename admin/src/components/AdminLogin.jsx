export default function AdminLogin({ credentials, setCredentials, onSubmit, error, busy }) {
  return (
    <main className="admin-login">
      <div className="login-brand"><span>R</span> Ride Local <small>ADMIN</small></div>
      <section>
        <span className="admin-eyebrow">OPERATIONS CONSOLE</span>
        <h1>Welcome back.</h1>
        <p>Sign in with your administrator account to manage Ride Local.</p>
        {error && <div className="admin-alert" role="alert">{error}</div>}
        <form onSubmit={onSubmit}>
          <label>Email address<input type="email" autoComplete="username" required value={credentials.email} onChange={(event) => setCredentials({ ...credentials, email: event.target.value })} placeholder="admin@example.com" /></label>
          <label>Password<input type="password" autoComplete="current-password" required value={credentials.password} onChange={(event) => setCredentials({ ...credentials, password: event.target.value })} placeholder="Your password" /></label>
          <button disabled={busy}>{busy ? 'Signing in…' : 'Sign in to admin →'}</button>
        </form>
        <small>Admin accounts are created securely in the database.</small>
      </section>
    </main>
  )
}
