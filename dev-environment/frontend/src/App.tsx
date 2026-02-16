import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate, Link } from 'react-router-dom'
import { CustomerSessionProvider, useCustomerSession } from './context/CustomerSessionContext'
import Home from './pages/Home'
import Login from './pages/Login'
import Customers from './pages/Customers'
import CustomerRegistration from './pages/CustomerRegistration'
import CustomerDetail from './pages/CustomerDetail'
import TimeSlotTemplates from './pages/TimeSlotTemplates'
import DeliverySlots from './pages/DeliverySlots'
import ZoneCoverages from './pages/ZoneCoverages'
import type { ReactNode } from 'react'
import './App.css'

function getAuthenticatedRedirectPath(customer: { id: number; type: string } | null): string {
  if (customer?.type === 'BUYER') {
    return `/clientes/${customer.id}`
  }
  return '/'
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isCheckingSession } = useCustomerSession()

  if (isCheckingSession) {
    return (
      <main className="page-container">
        <section className="card">
          <h2>Validando sesión...</h2>
        </section>
      </main>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function AdminRoute({ children }: { children: ReactNode }) {
  const { customer, isAuthenticated, isCheckingSession } = useCustomerSession()

  if (isCheckingSession) {
    return (
      <main className="page-container">
        <section className="card">
          <h2>Validando sesión...</h2>
        </section>
      </main>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (customer?.type !== 'ADMIN') {
    return <Navigate to={getAuthenticatedRedirectPath(customer)} replace />
  }

  return <>{children}</>
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { customer, isAuthenticated, isCheckingSession } = useCustomerSession()

  if (isCheckingSession) {
    return (
      <main className="page-container">
        <section className="card">
          <h2>Validando sesión...</h2>
        </section>
      </main>
    )
  }

  if (isAuthenticated) {
    return <Navigate to={getAuthenticatedRedirectPath(customer)} replace />
  }

  return <>{children}</>
}

function SessionBar() {
  const { customer, logout } = useCustomerSession()
  const location = useLocation()
  const navigate = useNavigate()

  if (location.pathname === '/login' || !customer) {
    return null
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="page-container app-global-bar">
      <div className="session-bar">
        <div className="session-info">
          <span className="session-greeting">
            Hola, <strong>{customer.fullName}</strong>
          </span>
          <span className="session-detail">{customer.email}</span>
          <span className="session-badge">{customer.type}</span>
        </div>
        <button type="button" className="secondary session-logout" onClick={handleLogout}>
          Cerrar sesion
        </button>
      </div>
    </div>
  )
}

function QuickActionsBar() {
  const { customer } = useCustomerSession()
  const location = useLocation()

  if (location.pathname === '/login' || !customer) {
    return null
  }

  const isAdmin = customer.type === 'ADMIN'

  return (
    <div className="page-container app-global-bar">
      <div className="quick-actions app-quick-actions">
        <Link to="/" className="primary-link">
          Ir al Inicio
        </Link>
        <Link to={`/clientes/${customer.id}`} className="primary-link">
          Ir a Mi Detalle
        </Link>
        {isAdmin && (
          <>
            <Link to="/clientes" className="primary-link">
              Ir a Gestion de Clientes
            </Link>
            <Link to="/rangos-tiempo" className="primary-link">
              Ir a Gestion de Rangos de Tiempo
            </Link>
            <Link to="/ventanas-entrega" className="primary-link">
              Ir a Gestion de Ventanas de Entrega
            </Link>
            <Link to="/zonas-cobertura" className="primary-link">
              Ir a Gestion de Zonas de Cobertura
            </Link>
          </>
        )}
      </div>
    </div>
  )
}

function AppRoutes() {
  return (
    <>
      <SessionBar />
      <QuickActionsBar />
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/registro-clientes"
          element={
            <PublicRoute>
              <CustomerRegistration />
            </PublicRoute>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/clientes"
          element={
            <AdminRoute>
              <Customers />
            </AdminRoute>
          }
        />
        <Route
          path="/clientes/:customerId"
          element={
            <ProtectedRoute>
              <CustomerDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rangos-tiempo"
          element={
            <AdminRoute>
              <TimeSlotTemplates />
            </AdminRoute>
          }
        />
        <Route
          path="/ventanas-entrega"
          element={
            <AdminRoute>
              <DeliverySlots />
            </AdminRoute>
          }
        />
        <Route
          path="/zonas-cobertura"
          element={
            <AdminRoute>
              <ZoneCoverages />
            </AdminRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <CustomerSessionProvider>
        <AppRoutes />
      </CustomerSessionProvider>
    </BrowserRouter>
  )
}

export default App
