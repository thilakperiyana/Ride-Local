export default function HomePage({ driversCount, navigate }) {
  return <>
    <section className="hero-section">
      <div className="hero-copy">
        <span className="eyebrow"><span className="pulse-dot" /> THE CITY IS YOURS</span>
        <h1>Good rides.<br /><em>Good local</em> people.</h1>
        <p>Your neighborhood, at your pace. Book a trusted local driver and get where you need to go.</p>
        <div className="hero-actions"><a className="button" href="/vehicles" onClick={(event) => { event.preventDefault(); navigate('/vehicles') }}>Book a ride <span>↗</span></a><span className="trust-note"><span className="avatar-stack">●●●</span> Your city, your community</span></div>
        <div className="hero-stats"><div><strong>100%</strong><span>Local drivers</span></div><div><strong>24/7</strong><span>Here when you need us</span></div><div><strong>Fair</strong><span>Upfront pricing</span></div></div>
      </div>
      <div className="hero-art"><div className="sun-orbit" /><div className="route-line route-one" /><div className="route-line route-two" /><span className="pin pin-one">⌖</span><span className="pin pin-two">⌖</span>
        <div className="city-card"><div className="city-map"><span className="map-road road-a" /><span className="map-road road-b" /><span className="map-road road-c" /><span className="map-park">✳</span><span className="map-pin">●</span><span className="map-pin second">●</span></div>
          <div className="city-card-footer"><span><small>YOUR NEIGHBORHOOD</small><b>Everywhere, together.</b></span><span className="online-badge"><i /> {driversCount} approved drivers</span></div>
        </div>
        <div className="floating-note"><span>✦</span> Made for your side of town</div><span className="hero-scribble">↗</span>
      </div>
    </section>
    <section className="how-section" id="rides">
      <div className="how-intro"><span className="section-kicker">IT'S THAT SIMPLE</span><h2>Good trips start<br />close to home.</h2><p>Ride Local connects you with the drivers who know your neighborhood best.</p><a href="/vehicles" onClick={(event) => { event.preventDefault(); navigate('/vehicles') }} className="text-link">Let's get moving <span>→</span></a></div>
      <div className="how-steps"><article><span className="step-number">01</span><div className="step-icon">⌖</div><h3>Choose your route</h3><p>Tell us where you're headed. We'll take it from here.</p></article><article><span className="step-number">02</span><div className="step-icon">♧</div><h3>Meet your local</h3><p>A nearby driver who knows these streets like home.</p></article><article><span className="step-number">03</span><div className="step-icon">↗</div><h3>Enjoy the ride</h3><p>Pay fairly, get there safely, and rate your experience.</p></article></div>
    </section>
  </>
}
