import { FormEvent, useEffect, useState } from 'react'
import {
  createTimeSlotTemplate,
  deleteTimeSlotTemplate,
  getTimeSlotTemplates,
  type TimeSlotTemplate,
  type TimeSlotTemplatePayload,
  updateTimeSlotTemplate,
} from '../services/timeSlotTemplates'

interface TimeSlotTemplateFormState {
  startTime: string
  endTime: string
  isActive: boolean
}

const initialForm: TimeSlotTemplateFormState = {
  startTime: '',
  endTime: '',
  isActive: true,
}

function toInputTime(value: string): string {
  return value?.slice(0, 5) ?? ''
}

function toApiTime(value: string): string {
  return value.length === 5 ? `${value}:00` : value
}

function toMinutes(value: string): number {
  const [hours, minutes] = value.split(':').map(Number)
  return (hours * 60) + minutes
}

function TimeSlotTemplates() {
  const [items, setItems] = useState<TimeSlotTemplate[]>([])
  const [form, setForm] = useState<TimeSlotTemplateFormState>(initialForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const loadItems = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getTimeSlotTemplates()
      setItems(data)
    } catch {
      setError('No se pudo cargar la lista de rangos de tiempo.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadItems()
  }, [])

  const clearMessages = () => {
    setError(null)
    setSuccessMessage(null)
  }

  const resetForm = () => {
    setForm(initialForm)
    setEditingId(null)
  }

  const toPayload = (): TimeSlotTemplatePayload => ({
    startTime: toApiTime(form.startTime),
    endTime: toApiTime(form.endTime),
    isActive: form.isActive,
  })

  const isEndTimeGreaterThanStartTime =
    form.startTime !== '' &&
    form.endTime !== '' &&
    toMinutes(form.endTime) > toMinutes(form.startTime)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    clearMessages()

    if (!isEndTimeGreaterThanStartTime) {
      setError('La hora de fin debe ser mayor a la hora de inicio.')
      return
    }

    setSubmitting(true)

    try {
      const payload = toPayload()
      if (editingId === null) {
        await createTimeSlotTemplate(payload)
        setSuccessMessage('Rango de Tiempo creado correctamente.')
      } else {
        await updateTimeSlotTemplate(editingId, payload)
        setSuccessMessage('Rango de Tiempo actualizado correctamente.')
      }
      resetForm()
      await loadItems()
    } catch (requestError: any) {
      const message =
        requestError?.response?.data?.details ||
        requestError?.response?.data?.error ||
        'No se pudo guardar el rango de tiempo.'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (item: TimeSlotTemplate) => {
    clearMessages()
    setEditingId(item.id)
    setForm({
      startTime: toInputTime(item.startTime),
      endTime: toInputTime(item.endTime),
      isActive: item.isActive,
    })
  }

  const handleDelete = async (item: TimeSlotTemplate) => {
    const confirmed = window.confirm(
      `¿Eliminar el Rango de Tiempo ${toInputTime(item.startTime)} - ${toInputTime(item.endTime)}?`
    )
    if (!confirmed) return

    clearMessages()
    try {
      await deleteTimeSlotTemplate(item.id)
      if (editingId === item.id) {
        resetForm()
      }
      setSuccessMessage('Rango de Tiempo eliminado correctamente.')
      await loadItems()
    } catch (requestError: any) {
      const message =
        requestError?.response?.data?.details ||
        requestError?.response?.data?.error ||
        'No se pudo eliminar el rango de tiempo.'
      setError(message)
    }
  }

  return (
    <main className="page-container">
      <header className="page-header">
        <h1>Administración de Rangos de Tiempo</h1>
        <p>Gestiona altas, edición, consulta y eliminación de cada Rango de Tiempo.</p>
      </header>

      <section className="card">
        <h2>{editingId === null ? 'Nuevo Rango de Tiempo' : `Editar Rango de Tiempo #${editingId}`}</h2>
        <form className="customer-form" onSubmit={handleSubmit}>
          <label htmlFor="startTime">Hora de inicio</label>
          <input
            id="startTime"
            type="time"
            value={form.startTime}
            onChange={(event) => setForm((prev) => ({ ...prev, startTime: event.target.value }))}
            required
          />

          <label htmlFor="endTime">Hora de fin</label>
          <input
            id="endTime"
            type="time"
            value={form.endTime}
            onChange={(event) => setForm((prev) => ({ ...prev, endTime: event.target.value }))}
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
            <button type="submit" disabled={submitting || !isEndTimeGreaterThanStartTime}>
              {submitting
                ? 'Guardando...'
                : editingId === null
                  ? 'Crear Rango de Tiempo'
                  : 'Actualizar Rango de Tiempo'}
            </button>
            {editingId !== null && (
              <button type="button" className="secondary" onClick={resetForm} disabled={submitting}>
                Cancelar edición
              </button>
            )}
          </div>
          {form.startTime !== '' && form.endTime !== '' && !isEndTimeGreaterThanStartTime && (
            <p className="feedback error">La hora de fin debe ser mayor a la hora de inicio.</p>
          )}
        </form>
      </section>

      {error && <p className="feedback error">{error}</p>}
      {successMessage && <p className="feedback success">{successMessage}</p>}

      <section className="card">
        <h2>Listado de Rangos de Tiempo</h2>
        {loading ? (
          <p>Cargando rangos de tiempo...</p>
        ) : items.length === 0 ? (
          <p>No hay rangos de tiempo registrados.</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Hora inicio</th>
                  <th>Hora fin</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{toInputTime(item.startTime)}</td>
                    <td>{toInputTime(item.endTime)}</td>
                    <td>{item.isActive ? 'Activo' : 'Inactivo'}</td>
                    <td className="row-actions">
                      <button type="button" className="secondary" onClick={() => handleEdit(item)}>
                        Editar
                      </button>
                      <button type="button" className="danger" onClick={() => handleDelete(item)}>
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

export default TimeSlotTemplates
