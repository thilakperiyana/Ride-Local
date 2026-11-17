import { useCallback, useEffect, useRef, useState } from 'react'
import './Home.css'
import AccountPage from './pages/AccountPage'
import DriversPage from './pages/DriversPage'
import DriverVehiclesPage from './pages/DriverVehiclesPage'
import FeedbackPage from './pages/FeedbackPage'
import HomePage from './pages/HomePage'
import PaymentsPage from './pages/PaymentsPage'
import RidesPage from './pages/RidesPage'
import VehiclesPage from './pages/VehiclesPage'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

function storedSession() {
  try {
    return JSON.parse(localStorage.getItem('rideLocalSession') || 'null')
  } catch {
    localStorage.removeItem('rideLocalSession')
    return null
  }
}

async function request(path, { token, ...options } = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(data.message || 'Something went wrong. Please try again.')
    error.status = response.status
    throw error
  }
  return data
}

export default function Home() {
  const [session, setSession] = useState(storedSession)
  const [path, setPath] = useState(() => window.location.pathname)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [authMode, setAuthMode] = useState('login')
  const [role, setRole] = useState('customer')
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', licenseNumber: '' })
  const [pickup, setPickup] = useState(null)
  const [destination, setDestination] = useState(null)
  const [activeMapSelection, setActiveMapSelection] = useState('pickup')
  const [minimumPickupTime] = useState(() => {
    const date = new Date(Date.now() + 60000)
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
    return date.toISOString().slice(0, 16)
  })
  const [pickupTime, setPickupTime] = useState(minimumPickupTime)
  const [locations, setLocations] = useState([])
  const [categories, setCategories] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [drivers, setDrivers] = useState([])
  const [driverVehicles, setDriverVehicles] = useState([])
  const [payments, setPayments] = useState([])
  const [driverPayments, setDriverPayments] = useState([])
  const [driverShare, setDriverShare] = useState(0)
  const [feedback, setFeedback] = useState([])
  const [vehicleForm, setVehicleForm] = useState({ vehicleNumber: '', vehicleName: '', category: '', serviceLocation: '', seats: 4 })
  const [feedbackDraft, setFeedbackDraft] = useState({})
  const [paymentChoice, setPaymentChoice] = useState({})
  const [trackingLocations, setTrackingLocations] = useState({})
  const [sharingRideId, setSharingRideId] = useState('')
  const [rides, setRides] = useState([])
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [catalogReady, setCatalogReady] = useState(false)
  const watchId = useRef(null)
  const mapLookupGeneration = useRef({ pickup: 0, destination: 0 })
  const lastMapLookupAt = useRef(0)
  const mapLookupQueue = useRef(Promise.resolve())
  function navigate(nextPath) {
    if (window.location.pathname !== nextPath) window.history.pushState(null, '', nextPath)
    setPath(nextPath)
    setMobileMenuOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname)
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const refreshCatalog = useCallback(async () => {
    try {
      const [locationData, categoryData, vehicleData, driverData] = await Promise.all([
        request('/catalog/locations'),
        request('/catalog/categories'),
        request('/catalog/vehicles'),
        request('/catalog/drivers'),
      ])
      setLocations(locationData.locations || [])
      setCategories(categoryData.categories || [])
      setVehicles(vehicleData.vehicles || [])
      setDrivers(driverData.drivers || [])
      setCatalogReady(true)
    } catch (err) {
      setError(err.message)
    }
  }, [])

  useEffect(() => {
    refreshCatalog()
    const timer = window.setInterval(refreshCatalog, 15000)
    return () => window.clearInterval(timer)
  }, [refreshCatalog])

  async function refreshRides(active = session) {
    if (!active?.token) return
    try {
      if (active.user.role === 'driver' && active.user.driverStatus !== 'approved') {
        const accountData = await request('/users/me', { token: active.token })
        if (accountData.user.driverStatus !== active.user.driverStatus) {
          const updatedSession = { ...active, user: accountData.user }
          localStorage.setItem('rideLocalSession', JSON.stringify(updatedSession))
          setSession(updatedSession)
        }
        setRides([])
      } else if (active.user.role === 'driver') {
        const [assigned, available, myVehicles, driverFeedback, shareData] = await Promise.all([
          request('/bookings/driver-bookings', { token: active.token }),
          request('/bookings/available', { token: active.token }),
          request('/catalog/my-vehicles', { token: active.token }),
          request('/bookings/my-feedback', { token: active.token }),
          request('/bookings/driver-payments', { token: active.token }),
        ])
        setRides([
          ...(available.bookings || []).map((ride) => ({ ...ride, isAvailable: true })),
          ...(assigned.bookings || []),
        ])
        setDriverVehicles(myVehicles.vehicles || [])
        setFeedback(driverFeedback.feedback || [])
        setDriverPayments(shareData.payments || [])
        setDriverShare(shareData.totalShare || 0)
      } else if (active.user.role === 'customer') {
        const [bookingData, paymentData, feedbackData] = await Promise.all([
          request('/bookings/my-bookings', { token: active.token }),
          request('/bookings/my-payments', { token: active.token }),
          request('/bookings/my-feedback', { token: active.token }),
        ])
        setRides(bookingData.bookings || [])
        setPayments(paymentData.payments || [])
        setFeedback(feedbackData.feedback || [])
      } else {
        setRides([])
      }
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    refreshRides()
  }, [session])

  useEffect(() => {
    if (!session?.token) return undefined
    const timer = window.setInterval(() => refreshRides(session), 10000)
    return () => window.clearInterval(timer)
  }, [session])

  useEffect(() => {
    if (!session?.token || session.user.role !== 'customer') return undefined
    const activeRides = rides.filter((ride) => ['accepted', 'ongoing'].includes(ride.status))
    if (!activeRides.length) {
      setTrackingLocations({})
      return undefined
    }

    let cancelled = false
    const refreshTracking = async () => {
      const results = await Promise.all(activeRides.map(async (ride) => {
        try {
          const data = await request(`/bookings/${ride._id}/location`, { token: session.token })
          return [ride._id, data.location]
        } catch (err) {
          if (!cancelled) setError(err.message)
          return [ride._id, null]
        }
      }))
      if (!cancelled) setTrackingLocations(Object.fromEntries(results))
    }
    refreshTracking()
    const timer = window.setInterval(refreshTracking, 10000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [session, rides])

  useEffect(() => {
    if (!sharingRideId || !session?.token) return undefined
    if (!navigator.geolocation) {
      setError('This browser does not support GPS location sharing.')
      setSharingRideId('')
      return undefined
    }

    let lastSentAt = 0
    let announced = false
    watchId.current = navigator.geolocation.watchPosition(async (position) => {
      if (Date.now() - lastSentAt < 7000) return
      lastSentAt = Date.now()
      try {
        await request(`/bookings/${sharingRideId}/location`, {
          token: session.token,
          method: 'PATCH',
          body: JSON.stringify({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
        })
        if (!announced) {
          setNotice('Live GPS sharing is on for this ride.')
          announced = true
        }
      } catch (err) {
        setError(err.message)
        setSharingRideId('')
      }
    }, (geoError) => {
      setError(`Could not access GPS: ${geoError.message}`)
      setSharingRideId('')
    }, { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 })

    return () => {
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current)
      watchId.current = null
    }
  }, [sharingRideId, session?.token])

  async function submitAuth(event) {
    event.preventDefault()
    setError('')
    setNotice('')
    setBusy(true)
    try {
      const endpoint = authMode === 'login' ? '/users/login' : '/users/register'
      const payload = authMode === 'login' ? { email: form.email, password: form.password } : { ...form, role }
      const data = await request(endpoint, { method: 'POST', body: JSON.stringify(payload) })
      if (authMode === 'register') {
        setNotice(data.message)
        setAuthMode('login')
        return
      }
      const active = { token: data.token, user: data.user }
      localStorage.setItem('rideLocalSession', JSON.stringify(active))
      setSession(active)
      setNotice(`Welcome, ${data.user.name.split(' ')[0]}.`)
      navigate(data.user.role === 'driver' ? '/rides' : '/vehicles')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function selectMapPoint(coordinates, selection) {
    const generation = ++mapLookupGeneration.current[selection]
    const fallbackAddress = `Map point ${coordinates.latitude.toFixed(5)}, ${coordinates.longitude.toFixed(5)}`
    const setPoint = selection === 'pickup' ? setPickup : setDestination
    setPoint({ ...coordinates, address: fallbackAddress })
    setError('')

    const lookup = mapLookupQueue.current.then(async () => {
      const wait = Math.max(0, 1000 - (Date.now() - lastMapLookupAt.current))
      if (wait) await new Promise((resolve) => window.setTimeout(resolve, wait))
      lastMapLookupAt.current = Date.now()
      const query = new URLSearchParams({
        format: 'jsonv2',
        'accept-language': 'en',
        lat: String(coordinates.latitude),
        lon: String(coordinates.longitude),
      })
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${query}`)
      if (!response.ok) throw new Error('Address lookup failed')
      return response.json()
    })
    mapLookupQueue.current = lookup.catch(() => {})
    try {
      const result = await lookup
      if (generation === mapLookupGeneration.current[selection] && result.display_name) {
        setPoint({ ...coordinates, address: result.display_name.slice(0, 300) })
      }
    } catch {
      if (generation === mapLookupGeneration.current[selection]) {
        setError('The map point is saved, but its address could not be loaded. The selected coordinates will still be used.')
      }
    }
  }

  async function createRide(event, vehicleCategory, vehicleId) {
    event.preventDefault()
    setError('')
    setNotice('')
    if (!pickup || !destination) {
      const message = 'Choose both pickup and drop-off points on the map.'
      setError(message)
      return message
    }
    if (pickup.latitude === destination.latitude && pickup.longitude === destination.longitude) {
      const message = 'Pickup and drop-off must be different map points.'
      setError(message)
      return message
    }
    if (!pickupTime || new Date(pickupTime) < new Date()) {
      const message = 'Choose a future pickup date and time, then try booking again.'
      setError(message)
      return message
    }
    if (!session) {
      const message = 'Please sign in or create an account to book a ride.'
      setError(message)
      navigate('/account')
      return message
    }
    if (session.user.role !== 'customer') {
      const message = 'Only customer accounts can book a ride.'
      setError(message)
      return message
    }
    setBusy(true)
    try {
      const data = await request('/bookings', {
        method: 'POST',
        token: session.token,
        body: JSON.stringify({
          pickup: pickup.address,
          destination: destination.address,
          pickupCoordinates: { latitude: pickup.latitude, longitude: pickup.longitude },
          destinationCoordinates: { latitude: destination.latitude, longitude: destination.longitude },
          vehicleCategory,
          vehicleId,
          pickupTime: new Date(pickupTime).toISOString(),
        }),
      })
      setNotice('Ride requested. A local driver will pick it up shortly.')
      setRides((current) => [data.booking, ...current])
      navigate('/rides')
      return true
    } catch (err) {
      setError(err.message)
      if (err.status === 409) await refreshCatalog()
      return err.message
    } finally {
      setBusy(false)
    }
  }

  async function addVehicle(event) {
    event.preventDefault()
    setError('')
    setNotice('')
    try {
      await request('/catalog/vehicles', { method: 'POST', token: session.token, body: JSON.stringify(vehicleForm) })
      setVehicleForm({ vehicleNumber: '', vehicleName: '', category: '', serviceLocation: '', seats: 4 })
      setNotice('Vehicle registered.')
      await Promise.all([refreshRides(), refreshCatalog()])
    } catch (err) {
      setError(err.message)
    }
  }

  async function removeVehicle(id) {
    try {
      await request(`/catalog/vehicles/${id}`, { method: 'DELETE', token: session.token })
      setDriverVehicles((current) => current.filter((vehicle) => vehicle._id !== id))
      setNotice('Vehicle removed.')
    } catch (err) {
      setError(err.message)
    }
  }

  async function payRide(ride) {
    const paymentMethod = paymentChoice[ride._id] || 'Cash'
    try {
      const data = await request(`/bookings/${ride._id}/payment`, {
        method: 'POST',
        token: session.token,
        body: JSON.stringify({ paymentMethod }),
      })
      setPayments((current) => [data.payment, ...current.filter((payment) => (payment.bookingId?._id || payment.bookingId) !== ride._id)])
      setNotice(data.message)
    } catch (err) {
      setError(err.message)
    }
  }

  async function submitFeedback(ride) {
    const draft = feedbackDraft[ride._id] || { rating: 5, comment: '' }
    try {
      const data = await request(`/bookings/${ride._id}/feedback`, {
        method: 'POST',
        token: session.token,
        body: JSON.stringify(draft),
      })
      setFeedback((current) => [...current, data.feedback])
      setNotice(data.message)
    } catch (err) {
      setError(err.message)
    }
  }

  async function rideAction(ride, action, body) {
    setError('')
    setNotice('')
    try {
      const data = await request(`/bookings/${ride._id}/${action}`, {
        method: 'PATCH',
        token: session.token,
        ...(body ? { body: JSON.stringify(body) } : {}),
      })
      if (action === 'reject') {
        setRides((current) => current.filter((item) => item._id !== ride._id))
        setNotice(data.message)
      } else {
        setNotice(data.message)
        if (body?.status === 'completed' && sharingRideId === ride._id) setSharingRideId('')
        await refreshRides()
      }
    } catch (err) {
      setError(err.message)
    }
  }

  async function toggleLocationSharing(ride) {
    if (sharingRideId === ride._id) {
      setSharingRideId('')
      try {
        const data = await request(`/bookings/${ride._id}/location`, {
          method: 'PATCH',
          token: session.token,
          body: JSON.stringify({ isSharing: false }),
        })
        setNotice(data.message)
      } catch (err) {
        setError(err.message)
      }
      return
    }
    setSharingRideId(ride._id)
  }

  async function logout() {
    if (sharingRideId && session?.token) {
      try {
        await request(`/bookings/${sharingRideId}/location`, {
          method: 'PATCH',
          token: session.token,
          body: JSON.stringify({ isSharing: false }),
        })
      } catch (err) {
        setError(err.message)
      }
    }
    localStorage.removeItem('rideLocalSession')
    setSession(null)
    setRides([])
    setSharingRideId('')
    setNotice('You have signed out.')
    navigate('/account')
  }

  const isDriver = session?.user.role === 'driver'
  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/vehicles', label: 'Vehicles' },
    { path: '/drivers', label: 'Drivers' },
    ...(session ? [{ path: '/rides', label: isDriver ? 'Requests & rides' : 'My rides' }] : []),
    ...(isDriver && session.user.driverStatus === 'approved' ? [
      { path: '/driver/vehicles', label: 'My vehicles' },
      { path: '/driver/payments', label: 'Payments' },
      { path: '/feedback', label: 'Feedback' },
    ] : []),
    ...(session?.user.role === 'customer' ? [
      { path: '/payments', label: 'Payments' },
      { path: '/feedback', label: 'Feedback' },
    ] : []),
  ]

  let page
  if (path === '/') {
    page = <HomePage driversCount={drivers.length} navigate={navigate} />
  } else if (path === '/vehicles') {
    page = <VehiclesPage locations={locations} categories={categories} vehicles={vehicles} pickup={pickup} destination={destination} activeMapSelection={activeMapSelection} onMapSelect={selectMapPoint} onChangeMapSelection={setActiveMapSelection} pickupTime={pickupTime} setPickupTime={setPickupTime} minimumPickupTime={minimumPickupTime} busy={busy} catalogReady={catalogReady} onBook={createRide} />
  } else if (path === '/drivers') {
    page = <DriversPage drivers={drivers} />
  } else if (path === '/account') {
    page = <AccountPage session={session} authMode={authMode} setAuthMode={setAuthMode} role={role} setRole={setRole} form={form} setForm={setForm} busy={busy} onSubmit={submitAuth} onLogout={logout} />
  } else if (!session) {
    page = <AccountPage session={session} authMode={authMode} setAuthMode={setAuthMode} role={role} setRole={setRole} form={form} setForm={setForm} busy={busy} onSubmit={submitAuth} onLogout={logout} />
  } else if (path === '/rides') {
    page = <RidesPage session={session} rides={rides} payments={payments} feedback={feedback} trackingLocations={trackingLocations} driverVehicles={driverVehicles} sharingRideId={sharingRideId} onRefresh={() => refreshRides()} onRideAction={rideAction} onToggleGps={toggleLocationSharing} />
  } else if (path === '/driver/vehicles' && isDriver && session.user.driverStatus === 'approved') {
    page = <DriverVehiclesPage vehicleForm={vehicleForm} setVehicleForm={setVehicleForm} categories={categories} locations={locations} driverVehicles={driverVehicles} onSubmit={addVehicle} onRemove={removeVehicle} />
  } else if (path === '/driver/payments' && isDriver && session.user.driverStatus === 'approved') {
    page = <PaymentsPage role="driver" driverPayments={driverPayments} driverShare={driverShare} />
  } else if (path === '/payments' && session.user.role === 'customer') {
    page = <PaymentsPage role="customer" rides={rides} payments={payments} paymentChoice={paymentChoice} setPaymentChoice={setPaymentChoice} onPay={payRide} />
  } else if (path === '/feedback' && ['customer', 'driver'].includes(session.user.role)) {
    page = <FeedbackPage role={session.user.role} rides={rides} feedback={feedback} feedbackDraft={feedbackDraft} setFeedbackDraft={setFeedbackDraft} onSubmit={submitFeedback} />
  } else {
    page = <section className="dashboard-section page-section"><div className="empty-state"><h2>Page not available</h2><p>This feature isn't available for your account.</p><button className="button button-small" onClick={() => navigate('/')}>Back to home</button></div></section>
  }

  return <div className="ride-app">
    <header className="site-header">
      <a className="brand" href="/" onClick={(event) => { event.preventDefault(); navigate('/') }} aria-label="Ride Local home"><span className="brand-mark">R</span>ride<span>local</span></a>
      <nav id="main-navigation" className={mobileMenuOpen ? 'mobile-menu-open' : ''} aria-label="Main navigation">{navItems.map((item) => <a key={item.path} className={path === item.path ? 'active' : ''} href={item.path} onClick={(event) => { event.preventDefault(); navigate(item.path) }}>{item.label}</a>)}</nav>
      <button className="mobile-menu-toggle" type="button" aria-controls="main-navigation" aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen((open) => !open)}>{mobileMenuOpen ? 'Close' : 'Menu'}</button>
      {session ? <div className="user-chip"><span className="user-avatar">{session.user.name?.[0]?.toUpperCase()}</span><span>{session.user.name.split(' ')[0]}</span><button className="text-button" onClick={logout}>Sign out</button></div> : <a className="button button-small" href="/account" onClick={(event) => { event.preventDefault(); navigate('/account') }}>Sign in</a>}
    </header>

    <main id="top">
      {notice && <div className="notice success" role="status">{notice}<button onClick={() => setNotice('')} aria-label="Dismiss">×</button></div>}
      {error && <div className="notice error" role="alert">{error}<button onClick={() => setError('')} aria-label="Dismiss">×</button></div>}
      {page}
    </main>
    <footer className="site-footer"><a className="brand" href="/" onClick={(event) => { event.preventDefault(); navigate('/') }}><span className="brand-mark">R</span>ride<span>local</span></a><span>Good rides make good neighborhoods.</span><span>© 2026 Ride Local</span></footer>
  </div>
}
