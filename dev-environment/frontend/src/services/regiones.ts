import api from './api'

export interface Region {
  id: number
  name: string
  ordinal: number
  abbreviation: string
}

export interface Ciudad {
  id: number
  name: string
  regionId: number
}

export interface Comuna {
  id: number
  name: string
  ciudadId: number
}

export async function getRegiones(): Promise<Region[]> {
  const response = await api.get<Region[]>('/regiones')
  return response.data
}

export async function getCiudadesByRegion(regionId: number): Promise<Ciudad[]> {
  const response = await api.get<Ciudad[]>(`/ciudades/by-region/${regionId}`)
  return response.data
}

export async function getComunasByCiudad(ciudadId: number): Promise<Comuna[]> {
  const response = await api.get<Comuna[]>(`/comunas/by-ciudad/${ciudadId}`)
  return response.data
}
