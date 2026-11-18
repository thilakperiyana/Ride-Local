import { useCallback, useEffect, useMemo, useState } from 'react'
import AdminLayout from './components/AdminLayout'
import AdminLogin from './components/AdminLogin'
import Notice from './components/Notice'
import BookingsPage from './pages/BookingsPage'
import CategoriesPage from './pages/CategoriesPage'
import DashboardPage from './pages/DashboardPage'
import DriversPage from './pages/DriversPage'
import FeedbackPage from './pages/FeedbackPage'
import FleetPage from './pages/FleetPage'
import LocationsPage from './pages/LocationsPage'
import PaymentsPage from './pages/PaymentsPage'
import './App.css'
import './components/Admin.css'

const API = import.meta.env.HOST
const ROUTES = {
  '/': 'overview',
  '/overview': 'overview',
  '/drivers': 'drivers',
  '/locations': 'locations',
  '/categories': 'categories',
  '/fleet': 'fleet',
  '/bookings': 'bookings',
  '/payments': 'payments',
  '/feedback': 'feedback',
}

function storedSession() {
  try {
    return JSON.parse(localStorage.getItem('rideLocalAdmin') || 'null')
  } catch {
    localStorage.removeItem('rideLocalAdmin')
    return null
  }
}

async function call(path, token, options = {}) {
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

async function fetchAdminData(token) {
  const [driverData, locationData, categoryData, vehicleData, paymentData, feedbackData, bookingData] = await Promise.all([
    call('/admin/drivers', token),
    call('/admin/locations', token),
    call('/admin/categories', token),
    call('/admin/vehicles', token),
    call('/admin/payments', token),
    call('/admin/feedback', token),
    call('/admin/bookings', token),
  ])
  return {
    drivers: driverData.drivers || [],
    locations: locationData.locations || [],
    categories: categoryData.categories || [],
    vehicles: vehicleData.vehicles || [],
    payments: paymentData.payments || [],
    feedback: feedbackData.feedback || [],
    bookings: bookingData.bookings || [],
  }
}

export default function App() {
  const [session, setSession] = useState(storedSession)
  const [credentials, setCredentials] = useState({ email: '', password: '' })
  const [path, setPath] = useState(() => window.location.pathname)
  const [drivers, setDrivers] = useState([])
  const [locations, setLocations] = useState([])
  const [categories, setCategories] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [payments, setPayments] = useState([])
  const [feedback, setFeedback] = useState([])
  const [bookings, setBookings] = useState([])
  const [location, setLocation] = useState({ name: '', city: '', state: '', latitude: '', longitude: '' })
  const [category, setCategory] = useState({ name: '', description: '', pricePerKm: '' })
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(false)
  const [today] = useState(() => new Date())

  const navigate = useCallback((nextPath) => {
    const route = ROUTES[nextPath] ? nextPath : '/overview'
    if (window.location.pathname !== route) window.history.pushState(null, '', route)
    setPath(route)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  useEffect(() => {
    const onPopState = () => setPath(ROUTES[window.location.pathname] ? window.location.pathname : '/overview')
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const setAdminData = useCallback((data) => {
    setDrivers(data.drivers)
    setLocations(data.locations)
    setCategories(data.categories)
    setVehicles(data.vehicles)
    setPayments(data.payments)
    setFeedback(data.feedback)
    setBookings(data.bookings)
  }, [])

  useEffect(() => {
    if (!session?.token) return undefined
    let active = true
    fetchAdminData(session.token)
      .then((data) => {
        if (!active) return
        setAdminData(data)
        setError('')
      })
      .catch((err) => {
        if (!active) return
        setError(err.message)
        if (err.message === 'Invalid or expired token' || err.message === 'Please log in') {
          localStorage.removeItem('rideLocalAdmin')
          setSession(null)
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [session?.token, setAdminData])

  const load = useCallback(async (token = session?.token) => {
    if (!token) return
    setLoading(true)
    try {
      setAdminData(await fetchAdminData(token))
      setError('')
    } catch (err) {
      setError(err.message)
      if (err.message === 'Invalid or expired token' || err.message === 'Please log in') {
        localStorage.removeItem('rideLocalAdmin')
        setSession(null)
      }
    } finally {
      setLoading(false)
    }
  }, [session?.token, setAdminData])

  async function login(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const data = await call('/users/login', null, { method: 'POST', body: JSON.stringify(credentials) })
      if (data.user.role !== 'admin') throw new Error('This account does not have administrator access.')
      const active = { token: data.token, user: data.user }
      localStorage.setItem('rideLocalAdmin', JSON.stringify(active))
      setSession(active)
      navigate('/overview')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function updateDriver(driver, status) {
    try {
      await call(`/admin/drivers/${driver._id}/status`, session.token, { method: 'PATCH', body: JSON.stringify({ status }) })
      setNotice(`${driver.name} marked ${status}.`)
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  async function addLocation(event) {
    event.preventDefault()
    try {
      await call('/admin/locations', session.token, { method: 'POST', body: JSON.stringify(location) })
      setLocation({ name: '', city: '', state: '', latitude: '', longitude: '' })
      setNotice('Location added.')
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  async function addCategory(event) {
    event.preventDefault()
    try {
      await call('/admin/categories', session.token, {
        method: 'POST',
        body: JSON.stringify({ ...category, pricePerKm: Number(category.pricePerKm) }),
      })
      setCategory({ name: '', description: '', pricePerKm: '' })
      setNotice('Vehicle category added.')
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  async function removeItem(kind, item) {
    try {
      await call(`/admin/${kind}/${item._id}`, session.token, { method: 'DELETE' })
      setNotice(`${kind === 'locations' ? 'Location' : 'Vehicle category'} removed.`)
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  function logout() {
    localStorage.removeItem('rideLocalAdmin')
    setSession(null)
    setPath('/overview')
  }

  const pending = useMemo(() => drivers.filter((driver) => driver.driverStatus === 'pending').length, [drivers])
  const paidPayments = useMemo(() => payments.filter((payment) => payment.status === 'paid'), [payments])
  const collected = useMemo(() => paidPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0), [paidPayments])
  const driverPayouts = useMemo(() => paidPayments.reduce((sum, payment) => sum + Number(payment.driverShare || 0), 0), [paidPayments])
  if (!session) {
    return <AdminLogin credentials={credentials} setCredentials={setCredentials} onSubmit={login} error={error} busy={busy} />
  }

  let page
  switch (ROUTES[path]) {
    case 'drivers':
      page = <DriversPage drivers={drivers} pending={pending} onUpdate={updateDriver} />
      break
    case 'locations':
      page = <LocationsPage locations={locations} value={location} setValue={setLocation} onSubmit={addLocation} onRemove={(item) => removeItem('locations', item)} />
      break
    case 'categories':
      page = <CategoriesPage categories={categories} value={category} setValue={setCategory} onSubmit={addCategory} onRemove={(item) => removeItem('categories', item)} />
      break
    case 'fleet':
      page = <FleetPage vehicles={vehicles} />
      break
    case 'bookings':
      page = <BookingsPage bookings={bookings} />
      break
    case 'payments':
      page = <PaymentsPage payments={payments} collected={collected} driverPayouts={driverPayouts} />
      break
    case 'feedback':
      page = <FeedbackPage feedback={feedback} />
      break
    case 'overview':
    default:
      page = <DashboardPage
        adminName={session.user.name}
        drivers={drivers}
        pending={pending}
        locations={locations}
        collected={collected}
        driverPayouts={driverPayouts}
        bookings={bookings}
        onNavigate={navigate}
      />
  }

  return (
    <AdminLayout session={session} path={path} pending={pending} today={today} onNavigate={navigate} onLogout={logout} onRefresh={() => { setLoading(true); load() }} loading={loading}>
      <Notice error={error} notice={notice} onDismiss={() => { setError(''); setNotice('') }} />
      {page}
    </AdminLayout>
  )
}
