import { FormEvent, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  createCustomer,
  deleteCustomer,
  getCustomers,
  type Customer,
  type CustomerPayload,
  type CustomerType,
  updateCustomer,
} from '../services/customers'

interface CustomerFormState {
  fullName: string
  email: string
  phone: string
  type: CustomerType
}

const initialForm: CustomerFormState = {
  fullName: '',
  email: '',
  phone: '',
  type: 'BUYER',
}

function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [form, setForm] = useState<CustomerFormState>(initialForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const loadCustomers = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getCustomers()
      setCustomers(data)
    } catch {
      setError('No se pudo cargar la lista de clientes.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCustomers()
  }, [])

  const clearMessages = () => {
    setError(null)
    setSuccessMessage(null)
  }

  const resetForm = () => {
    setForm(initialForm)
    setEditingId(null)
  }

  const toPayload = (): CustomerPayload => ({
    fullName: form.fullName.trim(),
    email: form.email.trim(),
    phone: form.phone.trim() || null,
    type: form.type,
  })

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    clearMessages()
    setSubmitting(true)

    try {
      const payload = toPayload()
      if (editingId === null) {
        await createCustomer(payload)
        setSuccessMessage('Cliente creado correctamente.')
      } else {
        await updateCustomer(editingId, payload)
        setSuccessMessage('Cliente actualizado correctamente.')
      }
      resetForm()
      await loadCustomers()
    } catch (requestError: any) {
      const message =
        requestError?.response?.data?.details ||
        requestError?.response?.data?.error ||
        'No se pudo guardar el cliente.'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (customer: Customer) => {
    clearMessages()
    setEditingId(customer.id)
    setForm({
      fullName: customer.fullName,
      email: customer.email,
      phone: customer.phone ?? '',
      type: customer.type,
    })
  }

  const handleDelete = async (customer: Customer) => {
    const confirmed = window.confirm(`¿Eliminar al cliente "${customer.fullName}"?`)
    if (!confirmed) return

    clearMessages()
    try {
      await deleteCustomer(customer.id)
      if (editingId === customer.id) {
        resetForm()
      }
      setSuccessMessage('Cliente eliminado correctamente.')
      await loadCustomers()
    } catch {
      setError('No se pudo eliminar el cliente.')
    }
  }

  return (
    <main className="page-container">
      <header className="page-header">
        <h1>Administración de Clientes</h1>
        <p>Gestiona altas, edición, consulta y eliminación de clientes.</p>
      </header>

      <section className="card">
        <h2>{editingId === null ? 'Nuevo Cliente' : `Editar Cliente #${editingId}`}</h2>
        <form className="customer-form" onSubmit={handleSubmit}>
          <label htmlFor="fullName">Nombre completo</label>
          <input
            id="fullName"
            type="text"
            value={form.fullName}
            onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
            required
            maxLength={200}
          />

          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            required
            maxLength={200}
          />

          <label htmlFor="phone">Teléfono</label>
          <input
            id="phone"
            type="text"
            value={form.phone}
            onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
            maxLength={30}
          />

          <label htmlFor="type">Tipo de cliente</label>
          <select
            id="type"
            value={form.type}
            onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value as CustomerType }))}
            required
          >
            <option value="BUYER">Buyer</option>
            <option value="ADMIN">Admin</option>
          </select>

          <div className="actions">
            <button type="submit" disabled={submitting}>
              {submitting ? 'Guardando...' : editingId === null ? 'Crear Cliente' : 'Actualizar Cliente'}
            </button>
            {editingId !== null && (
              <button
                type="button"
                className="secondary"
                onClick={resetForm}
                disabled={submitting}
              >
                Cancelar edición
              </button>
            )}
          </div>
        </form>
      </section>

      {error && <p className="feedback error">{error}</p>}
      {successMessage && <p className="feedback success">{successMessage}</p>}

      <section className="card">
        <h2>Listado de Clientes</h2>
        {loading ? (
          <p>Cargando clientes...</p>
        ) : customers.length === 0 ? (
          <p>No hay clientes registrados.</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Teléfono</th>
                  <th>Tipo</th>
                  <th>Creado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id}>
                    <td>{customer.id}</td>
                    <td>{customer.fullName}</td>
                    <td>{customer.email}</td>
                    <td>{customer.phone || '-'}</td>
                    <td>{customer.type}</td>
                    <td>{new Date(customer.createdAt).toLocaleString()}</td>
                    <td className="row-actions">
                      <Link to={`/clientes/${customer.id}`} className="primary-link detail-link">
                        Ver
                      </Link>
                      <button type="button" className="secondary" onClick={() => handleEdit(customer)}>
                        Editar
                      </button>
                      <button type="button" className="danger" onClick={() => handleDelete(customer)}>
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  )
}

export default Customers
