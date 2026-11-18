import { useCallback, useEffect, useMemo, useState } from 'react'
import BookingsPage from './pages/BookingsPage'
import DashboardPage from './pages/DashboardPage'
import DriversPage from './pages/DriversPage'
import FeedbackPage from './pages/FeedbackPage'
import LoginPage from './pages/LoginPage'
import PaymentsPage from './pages/PaymentsPage'
import RegisterPage from './pages/RegisterPage'
import VehiclesPage from './pages/VehiclesPage'
import DriverLayout from './components/DriverLayout'
import Notice from './components/Notice'

const API = import.meta.env.HOST
const SESSION_KEY = 'rideLocalDriverSession'
const emptyRegistration = () => ({
  name: '', email: '', phone: '', password: '', address: '', licenseNumber: '', licenseDocument: null,
  vehicleModel: '', vehicleNumber: '', category: '', serviceLocation: '', colour: '', seats: 4,
})
const emptyVehicle = () => ({ vehicleModel: '', vehicleNumber: '', category: '', serviceLocation: '', colour: '', seats: 4, isAvailable: true, vehicleImage: null })

function readSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null') }
  catch { localStorage.removeItem(SESSION_KEY); return null }
}

async function request(path, { token, ...options } = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || `Request failed (${response.status})`)
  return data
}

export default function App() {
  const [session, setSession] = useState(readSession)
  const [path, setPath] = useState(() => window.location.pathname)
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [registration, setRegistration] = useState(emptyRegistration)
  const [driver, setDriver] = useState(null)
  const [vehicles, setVehicles] = useState([])
  const [bookings, setBookings] = useState([])
  const [payments, setPayments] = useState([])
  const [totalShare, setTotalShare] = useState(0)
  const [feedback, setFeedback] = useState([])
  const [drivers, setDrivers] = useState([])
  const [categories, setCategories] = useState([])
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [busyId, setBusyId] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const navigate = useCallback((nextPath) => {
    if (window.location.pathname !== nextPath) window.history.pushState(null, '', nextPath)
    setPath(nextPath)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname)
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    let active = true
    Promise.all([request('/catalog/categories'), request('/catalog/locations')])
      .then(([categoryData, locationData]) => {
        if (!active) return
        setCategories(categoryData.categories || [])
        setLocations(locationData.locations || [])
      })
      .catch((err) => { if (active) setError(err.message) })
    return () => { active = false }
  }, [])

  const loadDriverData = useCallback(async (activeSession = session) => {
    if (!activeSession?.token) return
    setLoading(true)
    setError('')
    try {
      const profile = await request('/drivers/me', { token: activeSession.token })
      setDriver(profile.driver)
      if (profile.driver.driverStatus !== 'approved') {
        setBookings([])
        setVehicles([])
        setPayments([])
        setFeedback([])
        setTotalShare(0)
        return
      }
      const [assignedData, availableData, vehicleData, paymentData, feedbackData, directoryData] = await Promise.all([
        request('/bookings/driver-bookings', { token: activeSession.token }),
        request('/bookings/available', { token: activeSession.token }),
        request('/catalog/my-vehicles', { token: activeSession.token }),
        request('/bookings/driver-payments', { token: activeSession.token }),
        request('/bookings/my-feedback', { token: activeSession.token }),
        request('/drivers/directory', { token: activeSession.token }),
      ])
      setBookings([
        ...(availableData.bookings || []).map((ride) => ({ ...ride, isAvailable: true })),
        ...(assignedData.bookings || []),
      ])
      setVehicles(vehicleData.vehicles || [])
      setPayments(paymentData.payments || [])
      setTotalShare(paymentData.totalShare || 0)
      setFeedback(feedbackData.feedback || [])
      setDrivers(directoryData.drivers || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => {
    if (!session?.token) return undefined
    loadDriverData(session)
    const timer = window.setInterval(() => loadDriverData(session), 30000)
    return () => window.clearInterval(timer)
  }, [session, loadDriverData])

  async function submitLogin(event) {
    event.preventDefault()
    setBusy(true); setError(''); setNotice('')
    try {
      const data = await request('/users/login', { method: 'POST', body: JSON.stringify(loginForm) })
      if (data.user.role !== 'driver') throw new Error('This sign-in is for driver accounts. Please use your driver email.')
      const active = { token: data.token, user: data.user }
      localStorage.setItem(SESSION_KEY, JSON.stringify(active))
      setSession(active)
      setLoginForm({ email: '', password: '' })
      setNotice(`Welcome, ${data.user.name.split(' ')[0]}.`)
      navigate('/dashboard')
    } catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }

  async function submitRegistration(event) {
    event.preventDefault()
    setBusy(true); setError(''); setNotice('')
    try {
      const body = new FormData()
      Object.entries(registration).forEach(([key, value]) => {
        if (key !== 'licenseDocument') body.append(key, String(value))
      })
      if (registration.licenseDocument) body.append('licenseDocument', registration.licenseDocument)
      const data = await request('/drivers/register', { method: 'POST', body })
      setRegistration(emptyRegistration())
      setNotice(`${data.message} Status: ${data.driver.driverStatus}.`)
      navigate('/login')
    } catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }

  async function logout() {
    localStorage.removeItem(SESSION_KEY)
    setSession(null); setDriver(null); setBookings([]); setVehicles([])
    setPayments([]); setFeedback([]); setDrivers([])
    setNotice('You have signed out.')
    navigate('/login')
  }

  async function bookingAction(ride, action, body) {
    setBusyId(ride._id); setError(''); setNotice('')
    try {
      const data = await request(`/bookings/${ride._id}/${action}`, {
        method: 'PATCH', token: session.token, ...(body ? { body: JSON.stringify(body) } : {}),
      })
      setNotice(data.message)
      await loadDriverData(session)
    } catch (err) { setError(err.message) }
    finally { setBusyId('') }
  }

  async function saveVehicle(vehicle, editingId) {
    setBusy(true); setError(''); setNotice('')
    try {
      const body = new FormData()
      Object.entries(vehicle).forEach(([key, value]) => {
        if (key !== 'vehicleImage') body.append(key, String(value))
      })
      if (vehicle.vehicleImage) body.append('vehicleImage', vehicle.vehicleImage)
      const data = await request(editingId ? `/catalog/vehicles/${editingId}` : '/catalog/vehicles', {
        method: editingId ? 'PATCH' : 'POST',
        token: session.token,
        body,
      })
      setVehicles((current) => editingId
        ? current.map((item) => item._id === editingId ? { ...data.vehicle, isBooked: item.isBooked } : item)
        : [data.vehicle, ...current])
      setNotice(editingId ? 'Vehicle updated.' : 'Vehicle registered.')
      return true
    } catch (err) { setError(err.message); return false }
    finally { setBusy(false) }
  }

  async function deleteVehicle(id) {
    if (!window.confirm('Delete this vehicle from your fleet?')) return
    setError(''); setNotice('')
    try {
      const data = await request(`/catalog/vehicles/${id}`, { method: 'DELETE', token: session.token })
      setVehicles((current) => current.filter((vehicle) => vehicle._id !== id))
      setNotice(data.message)
    } catch (err) { setError(err.message) }
  }

  const assignedBookings = useMemo(() => bookings.filter((ride) => !ride.isAvailable), [bookings])
  const availableBookings = useMemo(() => bookings.filter((ride) => ride.isAvailable), [bookings])
  const stats = useMemo(() => ({
    totalBookings: assignedBookings.length,
    pending: availableBookings.length,
    accepted: assignedBookings.filter((ride) => ['accepted', 'ongoing'].includes(ride.status)).length,
    completed: assignedBookings.filter((ride) => ride.status === 'completed').length,
    earnings: totalShare,
  }), [assignedBookings, availableBookings, totalShare])

  const currentDriver = driver || session?.user
  let page
  if (!session) {
    if (path === '/register') page = <RegisterPage form={registration} setForm={setRegistration} categories={categories} locations={locations} busy={busy} onSubmit={submitRegistration} onLogin={() => navigate('/login')} />
    else page = <LoginPage form={loginForm} setForm={setLoginForm} busy={busy} onSubmit={submitLogin} onRegister={() => navigate('/register')} />
  } else {
    if (currentDriver?.driverStatus !== 'approved') {
      page = <DashboardPage driver={currentDriver} stats={stats} bookings={[]} onNavigate={navigate} onRefresh={() => loadDriverData(session)} refreshing={loading} />
    } else switch (path) {
      case '/bookings':
        page = <BookingsPage bookings={bookings} onAction={bookingAction} busyId={busyId} />
        break
      case '/vehicles':
        page = <VehiclesPage vehicles={vehicles} categories={categories} locations={locations} imageBaseUrl={API} onSave={saveVehicle} onDelete={deleteVehicle} saving={busy} />
        break
      case '/payments':
        page = <PaymentsPage payments={payments} totalShare={totalShare} />
        break
      case '/feedback':
        page = <FeedbackPage feedback={feedback} />
        break
      case '/drivers':
        page = <DriversPage drivers={drivers} />
        break
      case '/dashboard':
      default:
        page = <DashboardPage driver={currentDriver} stats={stats} bookings={assignedBookings} onNavigate={navigate} onRefresh={() => loadDriverData(session)} refreshing={loading} />
    }
  }

  return (
    <>
      <Notice error={error} notice={notice} onDismiss={() => { setError(''); setNotice('') }} />
      {session
        ? <DriverLayout path={path} driver={currentDriver} onNavigate={navigate} onLogout={logout}>{page}</DriverLayout>
        : <div className="auth-shell"><div className="auth-topline"><span>RIDE LOCAL</span><span>DRIVER PORTAL</span></div>{page}</div>}
      {session && loading && <div className="loading-indicator" role="status">Refreshing your driver data…</div>}
    </>
  )
}
