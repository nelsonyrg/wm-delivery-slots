import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import type { LatLngLiteral } from 'leaflet'
import { CircleMarker, MapContainer, Polygon, TileLayer, useMapEvents } from 'react-leaflet'
import { getCustomers, updateCustomer, type Customer } from '../services/customers'
import { useCustomerSession } from '../context/CustomerSessionContext'
import {
  createDeliveryAddress,
  deleteDeliveryAddress,
  getDeliveryAddressesByCustomer,
  updateDeliveryAddress,
  type DeliveryAddress,
  type DeliveryAddressPayload,
} from '../services/deliveryAddresses'
import {
  getZoneCoverages,
  type GeoJsonPolygon,
  type ZoneCoverage,
} from '../services/zoneCoverages'
import {
  getRegiones,
  getCiudadesByRegion,
  getComunasByCiudad,
  type Region,
  type Ciudad,
  type Comuna,
} from '../services/regiones'
import { getDeliverySlots, type DeliverySlot } from '../services/deliverySlots'
import { getTimeSlotTemplates, type TimeSlotTemplate } from '../services/timeSlotTemplates'
import {
  createReservation,
  deleteReservation,
  getReservationsByCustomer,
  updateReservation,
  type Reservation,
  type ReservationPayload,
  type ReservationStatus,
} from '../services/reservations'

interface AddressFormState {
  street: string
  locality: string
  regionId: string
  ciudadId: string
  comunaId: string
  commune: string
  region: string
  postalCode: string
  isDefault: boolean
}

interface ReservationFormState {
  deliveryAddressId: string
  deliverySlotId: string
  reservationDate: string
  reservationTime: string
  status: ReservationStatus
}

interface CustomerProfileFormState {
  fullName: string
  email: string
  phone: string
}

const initialForm: AddressFormState = {
  street: '',
  locality: '',
  regionId: '',
  ciudadId: '',
  comunaId: '',
  commune: '',
  region: '',
  postalCode: '',
  isDefault: false,
}

const initialReservationForm: ReservationFormState = {
  deliveryAddressId: '',
  deliverySlotId: '',
  reservationDate: '',
  reservationTime: '',
  status: 'CONFIRMED',
}

const initialCustomerProfileForm: CustomerProfileFormState = {
  fullName: '',
  email: '',
  phone: '',
}

const DEFAULT_CENTER: LatLngLiteral = { lat: -29.9027, lng: -71.2519 }
const DEFAULT_ZOOM = 12

interface MapClickCaptureProps {
  onMapClick: (point: LatLngLiteral) => void
}

function MapClickCapture({ onMapClick }: MapClickCaptureProps) {
  useMapEvents({
    click(event) {
      onMapClick(event.latlng)
    },
  })
  return null
}

function polygonToLatLng(boundary: GeoJsonPolygon | null): LatLngLiteral[] {
  if (!boundary || boundary.type !== 'Polygon' || boundary.coordinates.length === 0) {
    return []
  }
  return boundary.coordinates[0].map((coord) => ({ lat: coord[1], lng: coord[0] }))
}

function toInputTime(value: string): string {
  return value.length >= 5 ? value.slice(0, 5) : value
}

function formatTime(value: string): string {
  return value.length >= 5 ? value.slice(0, 5) : value
}

function formatSlotLabel(slot: DeliverySlot, template?: TimeSlotTemplate): string {
  if (!template) {
    return `${slot.deliveryDate} (Sin rango)`
  }
  return `${slot.deliveryDate} (${formatTime(template.startTime)} - ${formatTime(template.endTime)})`
}

function CustomerDetail() {
  const { customerId } = useParams<{ customerId: string }>()
  const customerIdNum = Number(customerId)
  const { customer: sessionCustomer, updateCustomerInSession } = useCustomerSession()

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [customerProfileForm, setCustomerProfileForm] = useState<CustomerProfileFormState>(initialCustomerProfileForm)
  const [isEditingCustomerProfile, setIsEditingCustomerProfile] = useState(false)
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([])
  const [zones, setZones] = useState<ZoneCoverage[]>([])
  const [deliverySlots, setDeliverySlots] = useState<DeliverySlot[]>([])
  const [timeSlotTemplates, setTimeSlotTemplates] = useState<TimeSlotTemplate[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])

  const [form, setForm] = useState<AddressFormState>(initialForm)
  const [selectedPoint, setSelectedPoint] = useState<LatLngLiteral | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)

  const [reservationForm, setReservationForm] = useState<ReservationFormState>(initialReservationForm)
  const [editingReservationId, setEditingReservationId] = useState<number | null>(null)

  const [loading, setLoading] = useState(true)
  const [customerProfileSubmitting, setCustomerProfileSubmitting] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [reservationSubmitting, setReservationSubmitting] = useState(false)

  const [customerProfileError, setCustomerProfileError] = useState<string | null>(null)
  const [customerProfileSuccessMessage, setCustomerProfileSuccessMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [reservationError, setReservationError] = useState<string | null>(null)
  const [reservationSuccessMessage, setReservationSuccessMessage] = useState<string | null>(null)

  const [regiones, setRegiones] = useState<Region[]>([])
  const [ciudades, setCiudades] = useState<Ciudad[]>([])
  const [comunas, setComunas] = useState<Comuna[]>([])

  const activeZones = useMemo(() => zones.filter((z) => z.isActive && z.boundary), [zones])

  const zoneColors = useMemo(() => {
    const palette = ['#0057d9', '#2563eb', '#1d4ed8', '#0284c7', '#0ea5e9', '#38bdf8', '#3b82f6', '#60a5fa']
    const map: Record<number, string> = {}
    activeZones.forEach((z, i) => {
      map[z.id] = palette[i % palette.length]
    })
    return map
  }, [activeZones])

  const timeSlotTemplateById = useMemo(
    () => new Map(timeSlotTemplates.map((template) => [template.id, template])),
    [timeSlotTemplates],
  )

  const deliverySlotById = useMemo(
    () => new Map(deliverySlots.map((slot) => [slot.id, slot])),
    [deliverySlots],
  )

  const addressById = useMemo(
    () => new Map(addresses.map((address) => [address.id, address])),
    [addresses],
  )

  const selectedAddressForReservation = useMemo(() => {
    if (!reservationForm.deliveryAddressId) {
      return null
    }
    return (
      addresses.find((address) => address.id === Number(reservationForm.deliveryAddressId)) ?? null
    )
  }, [addresses, reservationForm.deliveryAddressId])

  const slotIdForSelectedAddress = useMemo(() => {
    if (!selectedAddressForReservation || selectedAddressForReservation.zoneCoverageId == null) {
      return null
    }

    const zone = zones.find((item) => item.id === selectedAddressForReservation.zoneCoverageId)
    return zone?.deliverySlotId ?? null
  }, [selectedAddressForReservation, zones])

  const availableDeliverySlots = useMemo(() => {
    const activeSlots = deliverySlots.filter((slot) => slot.isActive)

    if (!selectedAddressForReservation) {
      return activeSlots
    }

    const selectedSlotId = reservationForm.deliverySlotId ? Number(reservationForm.deliverySlotId) : null
    const selectedSlot = selectedSlotId != null ? deliverySlotById.get(selectedSlotId) : undefined

    if (slotIdForSelectedAddress == null) {
      if (selectedSlot && !activeSlots.some((slot) => slot.id === selectedSlot.id)) {
        return [selectedSlot]
      }
      return []
    }

    const filtered = activeSlots.filter((slot) => slot.id === slotIdForSelectedAddress)
    if (selectedSlot && !filtered.some((slot) => slot.id === selectedSlot.id)) {
      return [...filtered, selectedSlot]
    }

    return filtered
  }, [
    deliverySlots,
    deliverySlotById,
    reservationForm.deliverySlotId,
    selectedAddressForReservation,
    slotIdForSelectedAddress,
  ])

  const canBuyerEditOwnProfile =
    sessionCustomer?.type === 'BUYER' &&
    sessionCustomer.id === customerIdNum &&
    customer?.id === customerIdNum

  const loadCustomer = async () => {
    try {
      const list = await getCustomers()
      const found = list.find((c) => c.id === customerIdNum) ?? null
      setCustomer(found)
      if (found) {
        setCustomerProfileForm({
          fullName: found.fullName,
          email: found.email,
          phone: found.phone ?? '',
        })
      }
    } catch {
      setError('No se pudo cargar la informacion del cliente.')
    }
  }

  const loadAddresses = async () => {
    try {
      const data = await getDeliveryAddressesByCustomer(customerIdNum)
      setAddresses(data)
    } catch {
      setError('No se pudo cargar las direcciones.')
    }
  }

  const loadZones = async () => {
    try {
      const data = await getZoneCoverages()
      setZones(data)
    } catch {
      setError('No se pudo cargar las zonas de cobertura.')
    }
  }

  const loadDeliverySlots = async () => {
    try {
      const data = await getDeliverySlots()
      setDeliverySlots(data)
    } catch {
      setReservationError('No se pudo cargar las Ventanas de Entrega.')
    }
  }

  const loadTimeSlotTemplates = async () => {
    try {
      const data = await getTimeSlotTemplates()
      setTimeSlotTemplates(data)
    } catch {
      setReservationError('No se pudo cargar los Rangos de Tiempo.')
    }
  }

  const loadReservations = async () => {
    try {
      const data = await getReservationsByCustomer(customerIdNum)
      setReservations(data)
    } catch {
      setReservationError('No se pudo cargar las reservas.')
    }
  }

  const loadRegiones = async () => {
    try {
      const data = await getRegiones()
      setRegiones(data)
    } catch {
      setError('No se pudo cargar las regiones.')
    }
  }

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true)
      await Promise.all([
        loadCustomer(),
        loadAddresses(),
        loadZones(),
        loadRegiones(),
        loadDeliverySlots(),
        loadTimeSlotTemplates(),
        loadReservations(),
      ])
      setLoading(false)
    }
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerIdNum])

  useEffect(() => {
    if (form.regionId) {
      getCiudadesByRegion(Number(form.regionId))
        .then(setCiudades)
        .catch(() => setCiudades([]))
    } else {
      setCiudades([])
      setComunas([])
    }
  }, [form.regionId])

  useEffect(() => {
    if (form.ciudadId) {
      getComunasByCiudad(Number(form.ciudadId))
        .then(setComunas)
        .catch(() => setComunas([]))
    } else {
      setComunas([])
    }
  }, [form.ciudadId])

  const clearMessages = () => {
    setError(null)
    setSuccessMessage(null)
  }

  const clearReservationMessages = () => {
    setReservationError(null)
    setReservationSuccessMessage(null)
  }

  const clearCustomerProfileMessages = () => {
    setCustomerProfileError(null)
    setCustomerProfileSuccessMessage(null)
  }

  const resetCustomerProfileForm = () => {
    if (!customer) {
      setCustomerProfileForm(initialCustomerProfileForm)
      return
    }
    setCustomerProfileForm({
      fullName: customer.fullName,
      email: customer.email,
      phone: customer.phone ?? '',
    })
  }

  const resetForm = () => {
    setForm(initialForm)
    setSelectedPoint(null)
    setEditingId(null)
    setCiudades([])
    setComunas([])
  }

  const resetReservationForm = () => {
    setReservationForm(initialReservationForm)
    setEditingReservationId(null)
  }

  const toPayload = (): DeliveryAddressPayload => ({
    customerId: customerIdNum,
    comunaId: form.comunaId ? Number(form.comunaId) : null,
    street: form.street.trim(),
    locality: form.locality.trim(),
    commune: form.commune.trim(),
    region: form.region.trim(),
    postalCode: form.postalCode.trim() || null,
    latitude: selectedPoint?.lat ?? null,
    longitude: selectedPoint?.lng ?? null,
    isDefault: form.isDefault,
  })

  const toReservationPayload = (): ReservationPayload => ({
    customerId: customerIdNum,
    deliveryAddressId: Number(reservationForm.deliveryAddressId),
    deliverySlotId: Number(reservationForm.deliverySlotId),
    reservationDate: reservationForm.reservationDate,
    reservationTime: reservationForm.reservationTime,
    status: reservationForm.status,
  })

  const handleCustomerProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    clearCustomerProfileMessages()

    if (!customer || !canBuyerEditOwnProfile) {
      setCustomerProfileError('No tienes permisos para editar este cliente.')
      return
    }

    setCustomerProfileSubmitting(true)
    try {
      const updated = await updateCustomer(customer.id, {
        fullName: customerProfileForm.fullName.trim(),
        email: customerProfileForm.email.trim(),
        phone: customerProfileForm.phone.trim() || null,
        type: customer.type,
      })
      setCustomer(updated)
      setCustomerProfileForm({
        fullName: updated.fullName,
        email: updated.email,
        phone: updated.phone ?? '',
      })
      updateCustomerInSession(updated)
      setIsEditingCustomerProfile(false)
      setCustomerProfileSuccessMessage('Datos de cliente actualizados correctamente.')
    } catch (requestError: any) {
      const message =
        requestError?.response?.data?.details ||
        requestError?.response?.data?.error ||
        'No se pudo actualizar los datos del cliente.'
      setCustomerProfileError(message)
    } finally {
      setCustomerProfileSubmitting(false)
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    clearMessages()

    if (!selectedPoint) {
      setError('Debes seleccionar una ubicacion en el mapa.')
      return
    }

    setSubmitting(true)
    try {
      const payload = toPayload()
      if (editingId === null) {
        await createDeliveryAddress(payload)
        setSuccessMessage('Direccion creada correctamente.')
      } else {
        await updateDeliveryAddress(editingId, payload)
        setSuccessMessage('Direccion actualizada correctamente.')
      }
      resetForm()
      await loadAddresses()
    } catch (requestError: any) {
      const message =
        requestError?.response?.data?.details ||
        requestError?.response?.data?.error ||
        'No se pudo guardar la direccion.'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleReservationSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    clearReservationMessages()

    if (!reservationForm.deliveryAddressId || !reservationForm.deliverySlotId) {
      setReservationError('Debes seleccionar direccion y Ventana de Entrega.')
      return
    }

    setReservationSubmitting(true)
    try {
      const payload = toReservationPayload()
      if (editingReservationId === null) {
        await createReservation(payload)
        setReservationSuccessMessage('Reserva creada correctamente.')
      } else {
        await updateReservation(editingReservationId, payload)
        setReservationSuccessMessage('Reserva actualizada correctamente.')
      }
      resetReservationForm()
      await Promise.all([loadReservations(), loadDeliverySlots()])
    } catch (requestError: any) {
      const message =
        requestError?.response?.data?.details ||
        requestError?.response?.data?.error ||
        'No se pudo guardar la reserva.'
      setReservationError(message)
    } finally {
      setReservationSubmitting(false)
    }
  }

  const handleStartEditCustomerProfile = () => {
    clearCustomerProfileMessages()
    resetCustomerProfileForm()
    setIsEditingCustomerProfile(true)
  }

  const handleCancelEditCustomerProfile = () => {
    resetCustomerProfileForm()
    clearCustomerProfileMessages()
    setIsEditingCustomerProfile(false)
  }

  const handleEdit = (addr: DeliveryAddress) => {
    clearMessages()
    setEditingId(addr.id)
    setForm({
      street: addr.street,
      locality: addr.locality,
      regionId: '',
      ciudadId: '',
      comunaId: '',
      commune: addr.commune,
      region: addr.region,
      postalCode: addr.postalCode ?? '',
      isDefault: addr.isDefault,
    })
    if (addr.latitude != null && addr.longitude != null) {
      setSelectedPoint({ lat: addr.latitude, lng: addr.longitude })
    } else {
      setSelectedPoint(null)
    }
  }

  const handleEditReservation = (reservation: Reservation) => {
    clearReservationMessages()
    setEditingReservationId(reservation.id)
    setReservationForm({
      deliveryAddressId: String(reservation.deliveryAddressId),
      deliverySlotId: String(reservation.deliverySlotId),
      reservationDate: reservation.reservationDate,
      reservationTime: toInputTime(reservation.reservationTime),
      status: reservation.status,
    })
  }

  const handleDelete = async (addr: DeliveryAddress) => {
    const confirmed = window.confirm(`¿Eliminar la direccion "${addr.street}"?`)
    if (!confirmed) return

    clearMessages()
    try {
      await deleteDeliveryAddress(addr.id)
      if (editingId === addr.id) {
        resetForm()
      }
      setSuccessMessage('Direccion eliminada correctamente.')
      await loadAddresses()
    } catch {
      setError('No se pudo eliminar la direccion.')
    }
  }

  const handleDeleteReservation = async (reservation: Reservation) => {
    const confirmed = window.confirm(`¿Eliminar la reserva #${reservation.id}?`)
    if (!confirmed) return

    clearReservationMessages()
    try {
      await deleteReservation(reservation.id)
      if (editingReservationId === reservation.id) {
        resetReservationForm()
      }
      setReservationSuccessMessage('Reserva eliminada correctamente.')
      await Promise.all([loadReservations(), loadDeliverySlots()])
    } catch {
      setReservationError('No se pudo eliminar la reserva.')
    }
  }

  const handleMapClick = (point: LatLngLiteral) => {
    setSelectedPoint(point)
  }

  const handleClearPoint = () => {
    setSelectedPoint(null)
  }

  const handleRegionChange = (regionId: string) => {
    const selectedRegion = regiones.find((r) => r.id === Number(regionId))
    setForm((prev) => ({
      ...prev,
      regionId,
      ciudadId: '',
      comunaId: '',
      region: selectedRegion?.name ?? '',
      commune: '',
    }))
  }

  const handleCiudadChange = (ciudadId: string) => {
    setForm((prev) => ({
      ...prev,
      ciudadId,
      comunaId: '',
      commune: '',
    }))
  }

  const handleComunaChange = (comunaId: string) => {
    const selectedComuna = comunas.find((c) => c.id === Number(comunaId))
    setForm((prev) => ({
      ...prev,
      comunaId,
      commune: selectedComuna?.name ?? '',
    }))
  }

  const handleReservationAddressChange = (deliveryAddressId: string) => {
    clearReservationMessages()
    if (!deliveryAddressId) {
      setReservationForm((prev) => ({
        ...prev,
        deliveryAddressId: '',
        deliverySlotId: '',
      }))
      return
    }

    const selectedAddress = addresses.find((address) => address.id === Number(deliveryAddressId))
    const zone = selectedAddress?.zoneCoverageId
      ? zones.find((item) => item.id === selectedAddress.zoneCoverageId)
      : undefined
    const slotId = zone?.deliverySlotId
    const slot = slotId != null ? deliverySlotById.get(slotId) : undefined
    const template = slot ? timeSlotTemplateById.get(slot.timeSlotTemplateId) : undefined

    setReservationForm((prev) => ({
      ...prev,
      deliveryAddressId,
      deliverySlotId: slotId != null ? String(slotId) : '',
      reservationDate: slot?.deliveryDate ?? prev.reservationDate,
      reservationTime: template ? toInputTime(template.startTime) : prev.reservationTime,
    }))
  }

  const handleReservationSlotChange = (deliverySlotId: string) => {
    clearReservationMessages()
    const slot = deliverySlotId ? deliverySlotById.get(Number(deliverySlotId)) : undefined
    const template = slot ? timeSlotTemplateById.get(slot.timeSlotTemplateId) : undefined

    setReservationForm((prev) => ({
      ...prev,
      deliverySlotId,
      reservationDate: slot?.deliveryDate ?? prev.reservationDate,
      reservationTime: template ? toInputTime(template.startTime) : prev.reservationTime,
    }))
  }

  const mapCenter = selectedPoint ?? DEFAULT_CENTER

  if (loading) {
    return (
      <main className="page-container">
        <p>Cargando...</p>
      </main>
    )
  }

  return (
    <main className="page-container">
      <header className="page-header">
        <h1>Detalle del Cliente</h1>
        <p>Consulta los datos del cliente y gestiona sus direcciones y reservas.</p>
      </header>

      {customer && (
        <section className="card customer-detail-card">
          <h2>Informacion del Cliente</h2>
          {!isEditingCustomerProfile ? (
            <>
              <div className="customer-detail-grid">
                <div className="detail-item">
                  <span className="detail-label">ID</span>
                  <span className="detail-value">{customer.id}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Nombre</span>
                  <span className="detail-value">{customer.fullName}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Email</span>
                  <span className="detail-value">{customer.email}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Telefono</span>
                  <span className="detail-value">{customer.phone || '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Tipo</span>
                  <span className="detail-value">
                    <span className="session-badge">{customer.type}</span>
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Registrado</span>
                  <span className="detail-value">{new Date(customer.createdAt).toLocaleString()}</span>
                </div>
              </div>
              {canBuyerEditOwnProfile && (
                <div className="actions">
                  <button type="button" onClick={handleStartEditCustomerProfile}>
                    Editar
                  </button>
                </div>
              )}
            </>
          ) : (
            <form className="customer-form" onSubmit={handleCustomerProfileSubmit}>
              <label htmlFor="customer-profile-fullName">Nombre completo</label>
              <input
                id="customer-profile-fullName"
                type="text"
                value={customerProfileForm.fullName}
                onChange={(event) =>
                  setCustomerProfileForm((prev) => ({ ...prev, fullName: event.target.value }))
                }
                required
                maxLength={200}
              />

              <label htmlFor="customer-profile-email">Email</label>
              <input
                id="customer-profile-email"
                type="email"
                value={customerProfileForm.email}
                onChange={(event) =>
                  setCustomerProfileForm((prev) => ({ ...prev, email: event.target.value }))
                }
                required
                maxLength={200}
              />

              <label htmlFor="customer-profile-phone">Telefono</label>
              <input
                id="customer-profile-phone"
                type="text"
                value={customerProfileForm.phone}
                onChange={(event) =>
                  setCustomerProfileForm((prev) => ({ ...prev, phone: event.target.value }))
                }
                maxLength={30}
              />

              <div className="actions">
                <button type="submit" disabled={customerProfileSubmitting}>
                  {customerProfileSubmitting ? 'Guardando...' : 'Guardar cambios'}
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={handleCancelEditCustomerProfile}
                  disabled={customerProfileSubmitting}
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
          {customerProfileError && <p className="feedback error">{customerProfileError}</p>}
          {customerProfileSuccessMessage && <p className="feedback success">{customerProfileSuccessMessage}</p>}
        </section>
      )}

      <section className="card">
        <h2>
          {editingReservationId === null
            ? 'Nueva Reserva'
            : `Editar Reserva #${editingReservationId}`}
        </h2>
        <form className="customer-form" onSubmit={handleReservationSubmit}>
          <label htmlFor="reservation-delivery-address">Direccion de entrega</label>
          <select
            id="reservation-delivery-address"
            value={reservationForm.deliveryAddressId}
            onChange={(event) => handleReservationAddressChange(event.target.value)}
            required
            disabled={addresses.length === 0}
          >
            <option value="">Seleccione una direccion</option>
            {addresses.map((address) => (
              <option key={address.id} value={address.id}>
                #{address.id} - {address.street} ({address.locality})
              </option>
            ))}
          </select>

          <label htmlFor="reservation-delivery-slot">Ventana de Entrega</label>
          <select
            id="reservation-delivery-slot"
            value={reservationForm.deliverySlotId}
            onChange={(event) => handleReservationSlotChange(event.target.value)}
            required
            disabled={availableDeliverySlots.length === 0}
          >
            <option value="">Seleccione una ventana</option>
            {availableDeliverySlots.map((slot) => (
              <option key={slot.id} value={slot.id}>
                #{slot.id} - {formatSlotLabel(slot, timeSlotTemplateById.get(slot.timeSlotTemplateId))}
              </option>
            ))}
          </select>

          {selectedAddressForReservation && slotIdForSelectedAddress == null && (
            <p className="map-status">
              La direccion seleccionada no tiene una zona asociada a una Ventana de Entrega.
            </p>
          )}

          <label htmlFor="reservation-date">Fecha de reserva</label>
          <input
            id="reservation-date"
            type="date"
            value={reservationForm.reservationDate}
            onChange={(event) =>
              setReservationForm((prev) => ({ ...prev, reservationDate: event.target.value }))
            }
            required
          />

          <label htmlFor="reservation-time">Hora de reserva</label>
          <input
            id="reservation-time"
            type="time"
            value={reservationForm.reservationTime}
            onChange={(event) =>
              setReservationForm((prev) => ({ ...prev, reservationTime: event.target.value }))
            }
            step={60}
            required
          />

          <label htmlFor="reservation-status">Estado</label>
          <select
            id="reservation-status"
            value={reservationForm.status}
            onChange={(event) =>
              setReservationForm((prev) => ({
                ...prev,
                status: event.target.value as ReservationStatus,
              }))
            }
          >
            <option value="CONFIRMED">Confirmada</option>
            <option value="CANCELLED">Cancelada</option>
            <option value="EXPIRED">Expirada</option>
          </select>

          <div className="actions">
            <button
              type="submit"
              disabled={reservationSubmitting || addresses.length === 0 || availableDeliverySlots.length === 0}
            >
              {reservationSubmitting
                ? 'Guardando...'
                : editingReservationId === null
                  ? 'Crear Reserva'
                  : 'Actualizar Reserva'}
            </button>
            {editingReservationId !== null && (
              <button
                type="button"
                className="secondary"
                onClick={resetReservationForm}
                disabled={reservationSubmitting}
              >
                Cancelar edicion
              </button>
            )}
          </div>
        </form>
      </section>

      {reservationError && <p className="feedback error">{reservationError}</p>}
      {reservationSuccessMessage && <p className="feedback success">{reservationSuccessMessage}</p>}

      <section className="card">
        <h2>Reservas</h2>
        {reservations.length === 0 ? (
          <p>No hay reservas registradas para este cliente.</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Direccion</th>
                  <th>Ventana de Entrega</th>
                  <th>Fecha y hora</th>
                  <th>Estado</th>
                  <th>Reservada en</th>
                  <th>Cancelada en</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((reservation) => {
                  const address = addressById.get(reservation.deliveryAddressId)
                  const deliverySlot = deliverySlotById.get(reservation.deliverySlotId)
                  const template = deliverySlot
                    ? timeSlotTemplateById.get(deliverySlot.timeSlotTemplateId)
                    : undefined

                  return (
                    <tr key={reservation.id}>
                      <td>{reservation.id}</td>
                      <td>
                        {address
                          ? `#${address.id} - ${address.street}`
                          : `#${reservation.deliveryAddressId}`}
                      </td>
                      <td>
                        {deliverySlot
                          ? `#${deliverySlot.id} - ${formatSlotLabel(deliverySlot, template)}`
                          : `#${reservation.deliverySlotId}`}
                      </td>
                      <td>
                        {reservation.reservationDate} {formatTime(reservation.reservationTime)}
                      </td>
                      <td>{reservation.status}</td>
                      <td>{new Date(reservation.reservedAt).toLocaleString()}</td>
                      <td>
                        {reservation.cancelledAt
                          ? new Date(reservation.cancelledAt).toLocaleString()
                          : '-'}
                      </td>
                      <td className="row-actions">
                        <button
                          type="button"
                          className="secondary"
                          onClick={() => handleEditReservation(reservation)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="danger"
                          onClick={() => handleDeleteReservation(reservation)}
                        >
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

      <section className="card">
        <h2>
          {editingId === null
            ? 'Nueva Direccion de Entrega'
            : `Editar Direccion #${editingId}`}
        </h2>
        <form className="customer-form" onSubmit={handleSubmit}>
          <label htmlFor="addr-street">Calle</label>
          <input
            id="addr-street"
            type="text"
            value={form.street}
            onChange={(e) => setForm((prev) => ({ ...prev, street: e.target.value }))}
            required
            maxLength={200}
            placeholder="Ej: Monjitas 2334"
          />

          <label htmlFor="addr-locality">Localidad</label>
          <input
            id="addr-locality"
            type="text"
            value={form.locality}
            onChange={(e) => setForm((prev) => ({ ...prev, locality: e.target.value }))}
            required
            maxLength={150}
          />

          <label htmlFor="addr-region-select">Region</label>
          <select
            id="addr-region-select"
            value={form.regionId}
            onChange={(e) => handleRegionChange(e.target.value)}
            required
          >
            <option value="">Seleccione una region</option>
            {regiones.map((r) => (
              <option key={r.id} value={r.id}>
                {r.abbreviation} - {r.name}
              </option>
            ))}
          </select>

          <label htmlFor="addr-ciudad-select">Ciudad (Provincia)</label>
          <select
            id="addr-ciudad-select"
            value={form.ciudadId}
            onChange={(e) => handleCiudadChange(e.target.value)}
            required
            disabled={!form.regionId}
          >
            <option value="">Seleccione una ciudad</option>
            {ciudades.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <label htmlFor="addr-comuna-select">Comuna</label>
          <select
            id="addr-comuna-select"
            value={form.comunaId}
            onChange={(e) => handleComunaChange(e.target.value)}
            required
            disabled={!form.ciudadId}
          >
            <option value="">Seleccione una comuna</option>
            {comunas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <label htmlFor="addr-postalCode">Codigo postal</label>
          <input
            id="addr-postalCode"
            type="text"
            value={form.postalCode}
            onChange={(e) => setForm((prev) => ({ ...prev, postalCode: e.target.value }))}
            maxLength={20}
          />

          <label htmlFor="addr-isDefault">Direccion por defecto</label>
          <select
            id="addr-isDefault"
            value={form.isDefault ? 'true' : 'false'}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, isDefault: e.target.value === 'true' }))
            }
          >
            <option value="false">No</option>
            <option value="true">Si</option>
          </select>

          <label>Selecciona la ubicacion en el mapa</label>
          <p className="map-instructions">
            Haz clic en el mapa para marcar la ubicacion de la direccion. Debe estar dentro de
            una zona de cobertura (poligonos coloreados).
          </p>
          <div className="zone-map-wrapper">
            <MapContainer center={mapCenter} zoom={DEFAULT_ZOOM} className="zone-map">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapClickCapture onMapClick={handleMapClick} />

              {activeZones.map((zone) => {
                const positions = polygonToLatLng(zone.boundary)
                if (positions.length < 3) return null
                return (
                  <Polygon
                    key={zone.id}
                    positions={positions}
                    pathOptions={{
                      color: zoneColors[zone.id],
                      fillColor: zoneColors[zone.id],
                      fillOpacity: 0.15,
                      weight: 2,
                    }}
                  />
                )
              })}

              {addresses.map((addr) => {
                if (addr.latitude == null || addr.longitude == null) return null
                if (editingId === addr.id) return null
                return (
                  <CircleMarker
                    key={addr.id}
                    center={{ lat: addr.latitude, lng: addr.longitude }}
                    radius={5}
                    pathOptions={{ color: '#64748b', fillColor: '#94a3b8', fillOpacity: 0.8 }}
                  />
                )
              })}

              {selectedPoint && (
                <CircleMarker
                  center={selectedPoint}
                  radius={8}
                  pathOptions={{ color: '#dc2626', fillColor: '#ef4444', fillOpacity: 0.9 }}
                />
              )}
            </MapContainer>
          </div>

          {activeZones.length > 0 && (
            <div className="zone-legend">
              {activeZones.map((zone) => (
                <span key={zone.id} className="zone-legend-item">
                  <span
                    className="zone-legend-color"
                    style={{ backgroundColor: zoneColors[zone.id] }}
                  />
                  {zone.name}
                </span>
              ))}
            </div>
          )}

          <div className="map-tools">
            <button type="button" className="secondary" onClick={handleClearPoint}>
              Limpiar punto
            </button>
          </div>
          <p className="map-status">
            {selectedPoint
              ? `Ubicacion: ${selectedPoint.lat.toFixed(6)}, ${selectedPoint.lng.toFixed(6)}`
              : 'Sin ubicacion seleccionada'}
          </p>

          <div className="actions">
            <button type="submit" disabled={submitting || !selectedPoint}>
              {submitting
                ? 'Guardando...'
                : editingId === null
                  ? 'Crear Direccion'
                  : 'Actualizar Direccion'}
            </button>
            {editingId !== null && (
              <button
                type="button"
                className="secondary"
                onClick={resetForm}
                disabled={submitting}
              >
                Cancelar edicion
              </button>
            )}
          </div>
        </form>
      </section>

      {error && <p className="feedback error">{error}</p>}
      {successMessage && <p className="feedback success">{successMessage}</p>}

      <section className="card">
        <h2>Direcciones de Entrega</h2>
        {addresses.length === 0 ? (
          <p>No hay direcciones registradas para este cliente.</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Calle</th>
                  <th>Localidad</th>
                  <th>Comuna</th>
                  <th>Region</th>
                  <th>Zona</th>
                  <th>Coordenadas</th>
                  <th>Por defecto</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {addresses.map((addr) => (
                  <tr key={addr.id}>
                    <td>{addr.id}</td>
                    <td>{addr.street}</td>
                    <td>{addr.locality}</td>
                    <td>{addr.commune}</td>
                    <td>{addr.region}</td>
                    <td>{addr.zoneCoverageName || '-'}</td>
                    <td>
                      {addr.latitude != null && addr.longitude != null
                        ? `${addr.latitude.toFixed(6)}, ${addr.longitude.toFixed(6)}`
                        : '-'}
                    </td>
                    <td>{addr.isDefault ? 'Si' : 'No'}</td>
                    <td className="row-actions">
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => handleEdit(addr)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="danger"
                        onClick={() => handleDelete(addr)}
                      >
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

export default CustomerDetail
