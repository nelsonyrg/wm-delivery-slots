import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createCustomer, type CustomerPayload } from '../services/customers'

interface RegistrationFormState {
  fullName: string
  email: string
  phone: string
}

const initialForm: RegistrationFormState = {
  fullName: '',
  email: '',
  phone: '',
}

function CustomerRegistration() {
  const navigate = useNavigate()
  const [form, setForm] = useState<RegistrationFormState>(initialForm)
  const [submitting, setSubmitting] = useState(false)

  const toPayload = (): CustomerPayload => ({
    fullName: form.fullName.trim(),
    email: form.email.trim(),
    phone: form.phone.trim() || null,
    type: 'BUYER',
  })

  const redirectToLogin = (messageType: 'success' | 'error', message: string) => {
    navigate('/login', {
      replace: true,
      state: {
        registrationResult: {
          type: messageType,
          message,
        },
      },
    })
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)

    try {
      await createCustomer(toPayload())
      redirectToLogin('success', 'Registro completado correctamente. Ya puedes iniciar sesión.')
    } catch (requestError: any) {
      const backendMessage =
        requestError?.response?.data?.details ||
        requestError?.response?.data?.error ||
        'No se pudo registrar el cliente.'
      redirectToLogin('error', `Resultado del registro: ${backendMessage}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="page-container">
      <section className="card">
        <h1>Registrar Cliente</h1>
        <p>Completa los datos para crear un nuevo cliente tipo Buyer.</p>

        <form className="customer-form" onSubmit={handleSubmit}>
          <label htmlFor="register-fullName">Nombre completo</label>
          <input
            id="register-fullName"
            type="text"
            value={form.fullName}
            onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
            required
            maxLength={200}
          />

          <label htmlFor="register-email">Email</label>
          <input
            id="register-email"
            type="email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            required
            maxLength={200}
          />

          <label htmlFor="register-phone">Teléfono</label>
          <input
            id="register-phone"
            type="text"
            value={form.phone}
            onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
            maxLength={30}
          />

          <div className="actions">
            <button type="submit" disabled={submitting}>
              {submitting ? 'Registrando...' : 'Registrar Cliente'}
            </button>
          </div>
        </form>
      </section>
    </main>
  )
}

export default CustomerRegistration
