import { FormEvent, useEffect, useState } from 'react'
import type { LatLngLiteral } from 'leaflet'
import { CircleMarker, MapContainer, Polygon, Polyline, TileLayer, useMapEvents } from 'react-leaflet'
import { getDeliverySlots, type DeliverySlot } from '../services/deliverySlots'
import {
  createZoneCoverage,
  deleteZoneCoverage,
  getZoneCoverages,
  type GeoJsonPolygon,
  type ZoneCoverage,
  type ZoneCoveragePayload,
  updateZoneCoverage,
} from '../services/zoneCoverages'
import {
  getRegiones,
  getCiudadesByRegion,
  getComunasByCiudad,
  type Region,
  type Ciudad,
  type Comuna,
} from '../services/regiones'

interface ZoneCoverageFormState {
  name: string
  regionId: string
  ciudadId: string
  comunaId: string
  commune: string
  region: string
  locality: string
  postalCode: string
  deliverySlotId: string
  maxCapacity: string
  isActive: boolean
}

const initialForm: ZoneCoverageFormState = {
  name: '',
  regionId: '',
  ciudadId: '',
  comunaId: '',
  commune: '',
  region: '',
  locality: '',
  postalCode: '',
  deliverySlotId: '',
  maxCapacity: '0',
  isActive: true,
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

function geoJsonToPoints(boundary: GeoJsonPolygon | null): LatLngLiteral[] {
  if (!boundary || boundary.type !== 'Polygon' || boundary.coordinates.length === 0) {
    return []
  }

  const raw = boundary.coordinates[0].map((coord) => ({ lat: coord[1], lng: coord[0] }))
  if (raw.length >= 2) {
    const first = raw[0]
    const last = raw[raw.length - 1]
    if (first.lat === last.lat && first.lng === last.lng) {
      return raw.slice(0, raw.length - 1)
    }
  }
  return raw
}

function pointsToGeoJson(points: LatLngLiteral[]): GeoJsonPolygon {
  const ring = points.map((point) => [point.lng, point.lat])
  if (ring.length > 0) {
    const first = ring[0]
    const last = ring[ring.length - 1]
    if (first[0] !== last[0] || first[1] !== last[1]) {
      ring.push([first[0], first[1]])
    }
  }
  return {
    type: 'Polygon',
    coordinates: [ring],
  }
}

function formatCentroid(zoneCoverage: ZoneCoverage): string {
  if (!zoneCoverage.location) {
    return '-'
  }
  const [lng, lat] = zoneCoverage.location.coordinates
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
}

function ZoneCoverages() {
  const [items, setItems] = useState<ZoneCoverage[]>([])
  const [deliverySlots, setDeliverySlots] = useState<DeliverySlot[]>([])
  const [form, setForm] = useState<ZoneCoverageFormState>(initialForm)
  const [polygonPoints, setPolygonPoints] = useState<LatLngLiteral[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingSlots, setLoadingSlots] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Cascading selectors state
  const [regiones, setRegiones] = useState<Region[]>([])
  const [ciudades, setCiudades] = useState<Ciudad[]>([])
  const [comunas, setComunas] = useState<Comuna[]>([])

  const maxCapacity = Number(form.maxCapacity)
  const isCapacityValid = Number.isFinite(maxCapacity) && maxCapacity >= 0
  const hasValidPolygon = polygonPoints.length >= 3

  const loadZoneCoverages = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getZoneCoverages()
      setItems(data)
    } catch {
      setError('No se pudo cargar la lista de Zonas de Cobertura.')
    } finally {
      setLoading(false)
    }
  }

  const loadDeliverySlots = async () => {
    setLoadingSlots(true)
    try {
      const data = await getDeliverySlots()
      setDeliverySlots(data)
    } catch {
      setError('No se pudo cargar la lista de Ventanas de Entrega.')
    } finally {
      setLoadingSlots(false)
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
    loadZoneCoverages()
    loadDeliverySlots()
    loadRegiones()
  }, [])

  // Load ciudades when region changes
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

  // Load comunas when ciudad changes
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

  const resetForm = () => {
    setForm(initialForm)
    setPolygonPoints([])
    setEditingId(null)
    setCiudades([])
    setComunas([])
  }

  const toPayload = (): ZoneCoveragePayload => ({
    name: form.name.trim(),
    comunaId: form.comunaId ? Number(form.comunaId) : null,
    commune: form.commune.trim(),
    region: form.region.trim(),
    locality: form.locality.trim() || null,
    postalCode: form.postalCode.trim() || null,
    deliverySlotId: form.deliverySlotId === '' ? null : Number(form.deliverySlotId),
    maxCapacity: Number(form.maxCapacity),
    boundary: pointsToGeoJson(polygonPoints),
    isActive: form.isActive,
  })

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    clearMessages()

    if (!isCapacityValid) {
      setError('La capacidad máxima debe ser mayor o igual a 0.')
      return
    }

    if (!hasValidPolygon) {
      setError('Debes dibujar un polígono válido en el mapa (mínimo 3 puntos).')
      return
    }

    setSubmitting(true)
    try {
      const payload = toPayload()
      if (editingId === null) {
        await createZoneCoverage(payload)
        setSuccessMessage('Zona de Cobertura creada correctamente.')
      } else {
        await updateZoneCoverage(editingId, payload)
        setSuccessMessage('Zona de Cobertura actualizada correctamente.')
      }
      resetForm()
      await loadZoneCoverages()
    } catch (requestError: any) {
      const message =
        requestError?.response?.data?.details ||
        requestError?.response?.data?.error ||
        'No se pudo guardar la Zona de Cobertura.'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (item: ZoneCoverage) => {
    clearMessages()
    setEditingId(item.id)
    setForm({
      name: item.name,
      regionId: '',
      ciudadId: '',
      comunaId: '',
      commune: item.commune,
      region: item.region,
      locality: item.locality ?? '',
      postalCode: item.postalCode ?? '',
      deliverySlotId: item.deliverySlotId === null ? '' : String(item.deliverySlotId),
      maxCapacity: String(item.maxCapacity),
      isActive: item.isActive,
    })
    setPolygonPoints(geoJsonToPoints(item.boundary))
  }

  const handleDelete = async (item: ZoneCoverage) => {
    const confirmed = window.confirm(`¿Eliminar la Zona de Cobertura "${item.name}"?`)
    if (!confirmed) return

    clearMessages()
    try {
      await deleteZoneCoverage(item.id)
      if (editingId === item.id) {
        resetForm()
      }
      setSuccessMessage('Zona de Cobertura eliminada correctamente.')
      await loadZoneCoverages()
    } catch (requestError: any) {
      const message =
        requestError?.response?.data?.details ||
        requestError?.response?.data?.error ||
        'No se pudo eliminar la Zona de Cobertura.'
      setError(message)
    }
  }

  const handleMapClick = (point: LatLngLiteral) => {
    setPolygonPoints((prev) => [...prev, point])
  }

  const handleUndoLastPoint = () => {
    setPolygonPoints((prev) => prev.slice(0, Math.max(0, prev.length - 1)))
  }

  const handleClearPolygon = () => {
    setPolygonPoints([])
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

  const mapCenter = polygonPoints.length > 0 ? polygonPoints[0] : DEFAULT_CENTER

  return (
    <main className="page-container">
      <header className="page-header">
        <h1>Administración de Zonas de Cobertura</h1>
        <p>Gestiona altas, edición, consulta y eliminación de cada Zona de Cobertura.</p>
      </header>

      <section className="card">
        <h2>{editingId === null ? 'Nueva Zona de Cobertura' : `Editar Zona de Cobertura #${editingId}`}</h2>
        <form className="customer-form" onSubmit={handleSubmit}>
          <label htmlFor="name">Nombre</label>
          <input
            id="name"
            type="text"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            required
            maxLength={100}
          />

          <label htmlFor="zc-region-select">Region</label>
          <select
            id="zc-region-select"
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

          <label htmlFor="zc-ciudad-select">Ciudad (Provincia)</label>
          <select
            id="zc-ciudad-select"
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

          <label htmlFor="zc-comuna-select">Comuna</label>
          <select
            id="zc-comuna-select"
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

          <label htmlFor="locality">Localidad</label>
          <input
            id="locality"
            type="text"
            value={form.locality}
            onChange={(event) => setForm((prev) => ({ ...prev, locality: event.target.value }))}
            maxLength={150}
          />

          <label htmlFor="postalCode">Código postal</label>
          <input
            id="postalCode"
            type="text"
            value={form.postalCode}
            onChange={(event) => setForm((prev) => ({ ...prev, postalCode: event.target.value }))}
            maxLength={20}
          />

          <label htmlFor="deliverySlotId">Ventana de Entrega</label>
          <select
            id="deliverySlotId"
            value={form.deliverySlotId}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, deliverySlotId: event.target.value }))
            }
            disabled={loadingSlots}
          >
            <option value="">Sin asignar</option>
            {deliverySlots.map((slot) => (
              <option key={slot.id} value={slot.id}>
                #{slot.id} - {slot.deliveryDate} - Template {slot.timeSlotTemplateId}
              </option>
            ))}
          </select>

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

          <label>Dibuja el polígono de cobertura</label>
          <p className="map-instructions">
            Haz clic en el mapa para agregar puntos. Se requiere un mínimo de 3 puntos.
          </p>
          <div className="zone-map-wrapper">
            <MapContainer center={mapCenter} zoom={DEFAULT_ZOOM} className="zone-map">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapClickCapture onMapClick={handleMapClick} />
              {polygonPoints.length >= 3 && (
                <Polygon positions={polygonPoints} pathOptions={{ color: '#0057d9' }} />
              )}
              {polygonPoints.length > 1 && polygonPoints.length < 3 && (
                <Polyline positions={polygonPoints} pathOptions={{ color: '#0057d9' }} />
              )}
              {polygonPoints.map((point, index) => (
                <CircleMarker key={`${point.lat}-${point.lng}-${index}`} center={point} radius={4} />
              ))}
            </MapContainer>
          </div>
          <div className="map-tools">
            <button type="button" className="secondary" onClick={handleUndoLastPoint}>
              Deshacer último punto
            </button>
            <button type="button" className="secondary" onClick={handleClearPolygon}>
              Limpiar polígono
            </button>
          </div>
          <p className="map-status">
            Puntos actuales: {polygonPoints.length} {hasValidPolygon ? '(polígono válido)' : ''}
          </p>

          <div className="actions">
            <button type="submit" disabled={submitting || !isCapacityValid || !hasValidPolygon}>
              {submitting
                ? 'Guardando...'
                : editingId === null
                  ? 'Crear Zona de Cobertura'
                  : 'Actualizar Zona de Cobertura'}
            </button>
            {editingId !== null && (
              <button type="button" className="secondary" onClick={resetForm} disabled={submitting}>
                Cancelar edición
              </button>
            )}
          </div>
          {!isCapacityValid && (
            <p className="feedback error">La capacidad máxima debe ser mayor o igual a 0.</p>
          )}
          {!hasValidPolygon && (
            <p className="feedback error">
              Debes dibujar un polígono válido en el mapa (mínimo 3 puntos).
            </p>
          )}
        </form>
      </section>

      {error && <p className="feedback error">{error}</p>}
      {successMessage && <p className="feedback success">{successMessage}</p>}

      <section className="card">
        <h2>Listado de Zonas de Cobertura</h2>
        {loading ? (
          <p>Cargando Zonas de Cobertura...</p>
        ) : items.length === 0 ? (
          <p>No hay Zonas de Cobertura registradas.</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Comuna</th>
                  <th>Región</th>
                  <th>Localidad</th>
                  <th>Código postal</th>
                  <th>Ventana</th>
                  <th>Capacidad</th>
                  <th>Polígono</th>
                  <th>Centroide</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.name}</td>
                    <td>{item.commune}</td>
                    <td>{item.region}</td>
                    <td>{item.locality || '-'}</td>
                    <td>{item.postalCode || '-'}</td>
                    <td>{item.deliverySlotId ?? '-'}</td>
                    <td>{item.maxCapacity}</td>
                    <td>{item.boundary ? `${Math.max(0, item.boundary.coordinates[0].length - 1)} puntos` : '-'}</td>
                    <td>{formatCentroid(item)}</td>
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

export default ZoneCoverages
