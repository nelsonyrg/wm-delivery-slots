import { FormEvent, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import { getCustomerByEmail } from '../services/customers'
import { useCustomerSession } from '../context/CustomerSessionContext'

interface RegistrationResultState {
  registrationResult?: {
    type: 'success' | 'error'
    message: string
  }
}

function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useCustomerSession()
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [registrationMessage, setRegistrationMessage] = useState<string | null>(null)
  const [registrationMessageType, setRegistrationMessageType] = useState<'success' | 'error'>('success')

  useEffect(() => {
    const state = location.state as RegistrationResultState | null
    const result = state?.registrationResult
    if (result) {
      setRegistrationMessage(result.message)
      setRegistrationMessageType(result.type)
      navigate('/login', { replace: true, state: null })
    }
  }, [location.state, navigate])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail) {
      setError('Debes ingresar un email.')
      return
    }

    setSubmitting(true)
    try {
      const customer = await getCustomerByEmail(normalizedEmail)
      await login(customer)
      if (customer.type === 'BUYER') {
        navigate(`/clientes/${customer.id}`, { replace: true })
      } else {
        navigate('/', { replace: true })
      }
    } catch (requestError: any) {
      const backendMessage = requestError?.response?.data?.error
      if (backendMessage === 'Usuario ya tiene una sesión activa') {
        setError('Usuario ya tiene una sesión activa')
      } else {
        setError(backendMessage || 'No se pudo iniciar sesión.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="page-container">
      <section className="card">
        <h1>Inicio de Sesión</h1>
        <p>Ingresa tu email para buscar tu usuario e iniciar sesión.</p>
        <p className="feedback success">
          Nota de revisión: Buyer `pedro.perez@mail.com` | Admin `mgonza@mmmm.cc`
        </p>

        <form className="customer-form" onSubmit={handleSubmit}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            maxLength={200}
            placeholder="nombre@dominio.com"
          />
          <div className="actions">
            <button type="submit" disabled={submitting}>
              {submitting ? 'Ingresando...' : 'Iniciar sesión'}
            </button>
            <Link to="/registro-clientes" className="primary-link">
              Registrar Cliente
            </Link>
          </div>
        </form>

        {registrationMessage && (
          <p className={`feedback ${registrationMessageType === 'success' ? 'success' : 'error'}`}>
            {registrationMessage}
          </p>
        )}
        {error && <p className="feedback error">{error}</p>}
      </section>
    </main>
  )
}

export default Login
