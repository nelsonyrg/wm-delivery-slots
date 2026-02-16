import api from './api'

export type ReservationStatus = 'CONFIRMED' | 'CANCELLED' | 'EXPIRED'

export interface Reservation {
  id: number
  customerId: number
  deliveryAddressId: number
  deliverySlotId: number
  status: ReservationStatus
  reservationDate: string
  reservationTime: string
  reservedAt: string
  cancelledAt: string | null
  version: number
}

export interface ReservationPayload {
  customerId: number
  deliveryAddressId: number
  deliverySlotId: number
  reservationDate: string
  reservationTime: string
  status?: ReservationStatus
}

export async function getReservationsByCustomer(customerId: number): Promise<Reservation[]> {
  const response = await api.get<Reservation[]>(`/reservations/by-customer/${customerId}`)
  return response.data
}

export async function createReservation(payload: ReservationPayload): Promise<Reservation> {
  const response = await api.post<Reservation>('/reservations', payload)
  return response.data
}

export async function updateReservation(id: number, payload: ReservationPayload): Promise<Reservation> {
  const response = await api.put<Reservation>(`/reservations/${id}`, payload)
  return response.data
}

export async function deleteReservation(id: number): Promise<void> {
  await api.delete(`/reservations/${id}`)
}
