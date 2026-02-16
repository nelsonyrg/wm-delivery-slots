import api from './api'

export interface GeoJsonPoint {
  type: 'Point'
  coordinates: [number, number]
}

export interface GeoJsonPolygon {
  type: 'Polygon'
  coordinates: number[][][]
}

export interface ZoneCoverage {
  id: number
  name: string
  comunaId: number | null
  commune: string
  region: string
  locality: string | null
  postalCode: string | null
  deliverySlotId: number | null
  maxCapacity: number
  boundary: GeoJsonPolygon | null
  location: GeoJsonPoint | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ZoneCoveragePayload {
  name: string
  comunaId?: number | null
  commune: string
  region: string
  locality?: string | null
  postalCode?: string | null
  deliverySlotId?: number | null
  maxCapacity: number
  boundary: GeoJsonPolygon
  isActive: boolean
}

export async function getZoneCoverages(): Promise<ZoneCoverage[]> {
  const response = await api.get<ZoneCoverage[]>('/zone-coverages')
  return response.data
}

export async function createZoneCoverage(payload: ZoneCoveragePayload): Promise<ZoneCoverage> {
  const response = await api.post<ZoneCoverage>('/zone-coverages', payload)
  return response.data
}

export async function updateZoneCoverage(id: number, payload: ZoneCoveragePayload): Promise<ZoneCoverage> {
  const response = await api.put<ZoneCoverage>(`/zone-coverages/${id}`, payload)
  return response.data
}

export async function deleteZoneCoverage(id: number): Promise<void> {
  await api.delete(`/zone-coverages/${id}`)
}
