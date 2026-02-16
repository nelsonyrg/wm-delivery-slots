import { FormEvent, useEffect, useMemo, useState } from 'react'
import {
  createDeliverySlot,
  deleteDeliverySlot,
  getDeliverySlots,
  type DeliverySlot,
  type DeliverySlotPayload,
  updateDeliverySlot,
} from '../services/deliverySlots'
import { getTimeSlotTemplates, type TimeSlotTemplate } from '../services/timeSlotTemplates'

interface DeliverySlotFormState {
  timeSlotTemplateId: string
  deliveryDate: string
  deliveryCost: string
  maxCapacity: string
  reservedCount: string
  isActive: boolean
}

const initialForm: DeliverySlotFormState = {
  timeSlotTemplateId: '',
  deliveryDate: '',
  deliveryCost: '0',
  maxCapacity: '0',
  reservedCount: '0',
  isActive: true,
}

function formatTime(value: string): string {
  return value?.slice(0, 5) ?? ''
}

function buildTimeSlotLabel(item: TimeSlotTemplate): string {
  return `${formatTime(item.startTime)} - ${formatTime(item.endTime)}`
}

function DeliverySlots() {
  const [slots, setSlots] = useState<DeliverySlot[]>([])
  const [timeSlotTemplates, setTimeSlotTemplates] = useState<TimeSlotTemplate[]>([])
  const [form, setForm] = useState<DeliverySlotFormState>(initialForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingTemplates, setLoadingTemplates] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const maxCapacity = Number(form.maxCapacity)
  const reservedCount = Number(form.reservedCount)
  const deliveryCost = Number(form.deliveryCost)
  const isCapacityValid =
    Number.isFinite(maxCapacity) &&
    Number.isFinite(reservedCount) &&
    maxCapacity >= 0 &&
    reservedCount >= 0 &&
    reservedCount <= maxCapacity
  const isCostValid = Number.isFinite(deliveryCost) && deliveryCost >= 0

  const templatesById = useMemo(() => {
    const map = new Map<number, TimeSlotTemplate>()
    timeSlotTemplates.forEach((item) => map.set(item.id, item))
    return map
  }, [timeSlotTemplates])

  const loadTimeSlotTemplates = async () => {
    setLoadingTemplates(true)
    try {
      const data = await getTimeSlotTemplates()
      setTimeSlotTemplates(data)
    } catch {
      setError('No se pudo cargar la lista de TimeSlotTemplate.')
    } finally {
      setLoadingTemplates(false)
    }
  }

  const loadSlots = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getDeliverySlots()
      setSlots(data)
    } catch {
      setError('No se pudo cargar la lista de Ventanas de Entrega.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSlots()
    loadTimeSlotTemplates()
  }, [])

  const clearMessages = () => {
    setError(null)
    setSuccessMessage(null)
  }

  const resetForm = () => {
    setForm(initialForm)
    setEditingId(null)
  }

  const toPayload = (): DeliverySlotPayload => ({
    timeSlotTemplateId: Number(form.timeSlotTemplateId),
    deliveryDate: form.deliveryDate,
    deliveryCost: Number(form.deliveryCost),
    maxCapacity: Number(form.maxCapacity),
    reservedCount: Number(form.reservedCount),
    isActive: form.isActive,
  })

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    clearMessages()

    if (!isCostValid) {
      setError('El costo de entrega debe ser mayor o igual a 0.')
      return
    }

    if (!isCapacityValid) {
      setError('La cantidad reservada debe ser menor o igual a la capacidad máxima.')
      return
    }

    setSubmitting(true)
    try {
      const payload = toPayload()
      if (editingId === null) {
        await createDeliverySlot(payload)
        setSuccessMessage('Ventana de Entrega creada correctamente.')
      } else {
        await updateDeliverySlot(editingId, payload)
        setSuccessMessage('Ventana de Entrega actualizada correctamente.')
      }
      resetForm()
      await loadSlots()
    } catch (requestError: any) {
      const message =
        requestError?.response?.data?.details ||
        requestError?.response?.data?.error ||
        'No se pudo guardar la Ventana de Entrega.'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (slot: DeliverySlot) => {
    clearMessages()
    setEditingId(slot.id)
    setForm({
      timeSlotTemplateId: String(slot.timeSlotTemplateId),
      deliveryDate: slot.deliveryDate,
      deliveryCost: String(slot.deliveryCost),
      maxCapacity: String(slot.maxCapacity),
      reservedCount: String(slot.reservedCount),
      isActive: slot.isActive,
    })
  }

  const handleDelete = async (slot: DeliverySlot) => {
    const template = templatesById.get(slot.timeSlotTemplateId)
    const templateLabel = template ? buildTimeSlotLabel(template) : `#${slot.timeSlotTemplateId}`
    const confirmed = window.confirm(
      `¿Eliminar la Ventana de Entrega del ${slot.deliveryDate} (${templateLabel})?`
    )
    if (!confirmed) return

    clearMessages()
    try {
      await deleteDeliverySlot(slot.id)
      if (editingId === slot.id) {
        resetForm()
      }
      setSuccessMessage('Ventana de Entrega eliminada correctamente.')
      await loadSlots()
    } catch (requestError: any) {
      const message =
        requestError?.response?.data?.details ||
        requestError?.response?.data?.error ||
        'No se pudo eliminar la Ventana de Entrega.'
      setError(message)
    }
  }

  return (
    <main className="page-container">
      <header className="page-header">
        <h1>Administración de Ventanas de Entrega</h1>
        <p>Gestiona altas, edición, consulta y eliminación de cada Ventana de Entrega.</p>
      </header>

      <section className="card">
        <h2>{editingId === null ? 'Nueva Ventana de Entrega' : `Editar Ventana de Entrega #${editingId}`}</h2>
        <form className="customer-form" onSubmit={handleSubmit}>
          <label htmlFor="timeSlotTemplateId">TimeSlotTemplate</label>
          <select
            id="timeSlotTemplateId"
            value={form.timeSlotTemplateId}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, timeSlotTemplateId: event.target.value }))
            }
            required
            disabled={loadingTemplates}
          >
            <option value="" disabled>
              {loadingTemplates ? 'Cargando TimeSlotTemplate...' : 'Selecciona un TimeSlotTemplate'}
            </option>
            {timeSlotTemplates.map((item) => (
              <option key={item.id} value={item.id}>
                {buildTimeSlotLabel(item)} {item.isActive ? '(Activo)' : '(Inactivo)'}
              </option>
            ))}
          </select>

          <label htmlFor="deliveryDate">Fecha de entrega</label>
          <input
            id="deliveryDate"
            type="date"
            value={form.deliveryDate}
            onChange={(event) => setForm((prev) => ({ ...prev, deliveryDate: event.target.value }))}
            required
          />

          <label htmlFor="deliveryCost">Costo de entrega</label>
          <input
            id="deliveryCost"
            type="number"
            step="0.01"
            min="0"
            value={form.deliveryCost}
            onChange={(event) => setForm((prev) => ({ ...prev, deliveryCost: event.target.value }))}
            required
          />

          <label htmlFor="maxCapacity">Capacidad máxima</label>
          <input
            id="maxCapacity"
            type="number"
            min="0"
            step="1"
            value={form.maxCapacity}
            onChange={(event) => setForm((prev) => ({ ...prev, maxCapacity: event.target.value }))}
            required
          />

          <label htmlFor="reservedCount">Cantidad reservada</label>
          <input
            id="reservedCount"
            type="number"
            min="0"
            step="1"
            value={form.reservedCount}
            onChange={(event) => setForm((prev) => ({ ...prev, reservedCount: event.target.value }))}
            required
          />

          <label htmlFor="isActive">Estado</label>
          <select
            id="isActive"
            value={form.isActive ? 'true' : 'false'}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, isActive: event.target.value === 'true' }))
            }
          >
            <option value="true">Activo</option>
            <option value="false">Inactivo</option>
          </select>

          <div className="actions">
            <button
              type="submit"
              disabled={submitting || loadingTemplates || !isCapacityValid || !isCostValid}
            >
              {submitting
                ? 'Guardando...'
                : editingId === null
                  ? 'Crear Ventana de Entrega'
                  : 'Actualizar Ventana de Entrega'}
            </button>
            {editingId !== null && (
              <button type="button" className="secondary" onClick={resetForm} disabled={submitting}>
                Cancelar edición
              </button>
            )}
          </div>
          {!isCostValid && (
            <p className="feedback error">El costo de entrega debe ser mayor o igual a 0.</p>
          )}
          {!isCapacityValid && (
            <p className="feedback error">
              La cantidad reservada debe ser menor o igual a la capacidad máxima.
            </p>
          )}
        </form>
      </section>

      {error && <p className="feedback error">{error}</p>}
      {successMessage && <p className="feedback success">{successMessage}</p>}

      <section className="card">
        <h2>Listado de Ventanas de Entrega</h2>
        {loading ? (
          <p>Cargando Ventanas de Entrega...</p>
        ) : slots.length === 0 ? (
          <p>No hay Ventanas de Entrega registradas.</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Fecha</th>
                  <th>TimeSlotTemplate</th>
                  <th>Costo</th>
                  <th>Capacidad</th>
                  <th>Reservadas</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {slots.map((slot) => {
                  const template = templatesById.get(slot.timeSlotTemplateId)
                  return (
                    <tr key={slot.id}>
                      <td>{slot.id}</td>
                      <td>{slot.deliveryDate}</td>
                      <td>{template ? buildTimeSlotLabel(template) : `#${slot.timeSlotTemplateId}`}</td>
                      <td>{slot.deliveryCost}</td>
                      <td>{slot.maxCapacity}</td>
                      <td>{slot.reservedCount}</td>
                      <td>{slot.isActive ? 'Activo' : 'Inactivo'}</td>
                      <td className="row-actions">
                        <button type="button" className="secondary" onClick={() => handleEdit(slot)}>
                          Editar
                        </button>
                        <button type="button" className="danger" onClick={() => handleDelete(slot)}>
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  )
}

export default DeliverySlots
