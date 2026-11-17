export default function AccountPage({ session, authMode, setAuthMode, role, setRole, form, setForm, busy, onSubmit, onLogout }) {
  return <section className="account-section page-section" id="account">
    <div className="account-copy"><span className="section-kicker">COME ON IN</span><h2>{session ? `Good to have you, ${session.user.name.split(' ')[0]}.` : 'A little closer to everywhere.'}</h2><p>{session ? 'Your local ride community is ready when you are.' : 'Join your neighbors and get where you need to go with Ride Local.'}</p><div className="account-perks"><span>✦ Drivers from your community</span><span>✦ Clear, fair fares</span><span>✦ Every ride supports local</span></div></div>
    {session ? <div className="signed-in-card"><span className="account-avatar">{session.user.name?.[0]?.toUpperCase()}</span><div><small>YOUR ACCOUNT</small><h3>{session.user.name}</h3><p>{session.user.role === 'driver' ? `Driver · ${session.user.driverStatus}` : 'Customer'}</p></div><button className="button button-outline" onClick={onLogout}>Sign out</button></div>
      : <div className="auth-card">
        <div className="auth-tabs"><button className={authMode === 'login' ? 'active' : ''} onClick={() => setAuthMode('login')}>Sign in</button><button className={authMode === 'register' ? 'active' : ''} onClick={() => setAuthMode('register')}>Create account</button></div>
        <form onSubmit={onSubmit}>
          {authMode === 'register' && <>
            <div className="role-switch"><button type="button" className={role === 'customer' ? 'selected' : ''} onClick={() => setRole('customer')}>I'm a rider</button><button type="button" className={role === 'driver' ? 'selected' : ''} onClick={() => setRole('driver')}>I'm a driver</button></div>
            <label>Full name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Your name" required /></label>
            <label>Phone number<input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="Your phone" required /></label>
            {role === 'driver' && <label>Driver license number<input value={form.licenseNumber} onChange={(event) => setForm({ ...form, licenseNumber: event.target.value })} placeholder="License number" required /></label>}
          </>}
          <label>Email address<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" required /></label>
          <label>Password<input type="password" minLength="6" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="At least 6 characters" required /></label>
          <button className="button auth-submit" disabled={busy}>{busy ? 'One moment…' : authMode === 'login' ? 'Sign in to Ride Local →' : role === 'driver' ? 'Apply to drive →' : 'Create my account →'}</button>
          <p className="auth-footnote">By continuing, you agree to our community guidelines.</p>
        </form>
      </div>}
  </section>
}
