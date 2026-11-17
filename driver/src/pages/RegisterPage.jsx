export default function RegisterPage({ form, setForm, categories, locations, onSubmit, onLogin, busy }) {
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }))
  return (
    <section className="register-page">
      <div className="page-heading">
        <span className="section-kicker">DRIVER APPLICATION</span>
        <h1>Join the local network.</h1>
        <p>Complete your profile and vehicle details. Your application will be reviewed before you can accept rides.</p>
      </div>
      <form className="application-card" onSubmit={onSubmit}>
        <div className="form-section-title"><span>01</span><div><h2>Personal details</h2><p>Your account and contact information</p></div></div>
        <div className="form-grid">
          <label>Full name<input required maxLength="100" value={form.name} onChange={(event) => update('name', event.target.value)} /></label>
          <label>Email address<input required type="email" value={form.email} onChange={(event) => update('email', event.target.value)} /></label>
          <label>Phone number<input required type="tel" maxLength="24" value={form.phone} onChange={(event) => update('phone', event.target.value)} /></label>
          <label>Password<input required type="password" minLength="8" autoComplete="new-password" value={form.password} onChange={(event) => update('password', event.target.value)} /><small>Use at least 8 characters.</small></label>
          <label className="wide-field">Address<textarea required rows="2" maxLength="300" value={form.address} onChange={(event) => update('address', event.target.value)} /></label>
        </div>
        <div className="form-section-title"><span>02</span><div><h2>Driving licence</h2><p>Upload an image or PDF (maximum 5 MB)</p></div></div>
        <div className="form-grid">
          <label>Licence number<input required maxLength="40" value={form.licenseNumber} onChange={(event) => update('licenseNumber', event.target.value)} /></label>
          <label>Licence document<input required type="file" accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf" onChange={(event) => update('licenseDocument', event.target.files?.[0] || null)} /><small>{form.licenseDocument?.name || 'JPG, PNG, or PDF · up to 5 MB'}</small></label>
        </div>
        <div className="form-section-title"><span>03</span><div><h2>Vehicle details</h2><p>Your first vehicle is added to your application</p></div></div>
        <div className="form-grid">
          <label>Vehicle model<input required maxLength="80" value={form.vehicleModel} onChange={(event) => update('vehicleModel', event.target.value)} placeholder="e.g. Swift Dzire" /></label>
          <label>Vehicle number<input required maxLength="20" value={form.vehicleNumber} onChange={(event) => update('vehicleNumber', event.target.value.toUpperCase())} /></label>
          <label>Category<select required value={form.category} onChange={(event) => update('category', event.target.value)}><option value="">Select category</option>{categories.map((item) => <option key={item._id} value={item.name}>{item.name}</option>)}</select></label>
          <label>Service location<select required value={form.serviceLocation} onChange={(event) => update('serviceLocation', event.target.value)}><option value="">Select location</option>{locations.map((item) => <option key={item._id} value={item.name}>{item.name}</option>)}</select></label>
          <label>Vehicle colour<input required maxLength="40" value={form.colour} onChange={(event) => update('colour', event.target.value)} /></label>
          <label>Number of seats<input type="number" min="1" max="20" required value={form.seats} onChange={(event) => update('seats', Number(event.target.value))} /></label>
        </div>
        <div className="application-submit"><p>Submitting creates a pending application. Booking access is enabled after approval.</p><button className="primary-button" disabled={busy}>{busy ? 'Submitting application…' : 'Submit driver application'}</button></div>
        <p className="auth-switch">Already registered? <button type="button" onClick={onLogin}>Sign in</button></p>
      </form>
    </section>
  )
}
