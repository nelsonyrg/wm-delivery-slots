import api from './api'

export interface DeliveryAddress {
  id: number
  customerId: number
  zoneCoverageId: number | null
  zoneCoverageName: string | null
  comunaId: number | null
  street: string
  locality: string
  commune: string
  region: string
  postalCode: string | null
  latitude: number | null
  longitude: number | null
  isDefault: boolean
  createdAt: string
}

export interface DeliveryAddressPayload {
  customerId: number
  comunaId?: number | null
  street: string
  locality: string
  commune: string
  region: string
  postalCode?: string | null
  latitude?: number | null
  longitude?: number | null
  isDefault?: boolean
}

export async function getDeliveryAddressesByCustomer(customerId: number): Promise<DeliveryAddress[]> {
  const response = await api.get<DeliveryAddress[]>(`/delivery-addresses/by-customer/${customerId}`)
  return response.data
}

export async function createDeliveryAddress(payload: DeliveryAddressPayload): Promise<DeliveryAddress> {
  const response = await api.post<DeliveryAddress>('/delivery-addresses', payload)
  return response.data
}

export async function updateDeliveryAddress(id: number, payload: DeliveryAddressPayload): Promise<DeliveryAddress> {
  const response = await api.put<DeliveryAddress>(`/delivery-addresses/${id}`, payload)
  return response.data
}

export async function deleteDeliveryAddress(id: number): Promise<void> {
  await api.delete(`/delivery-addresses/${id}`)
}
