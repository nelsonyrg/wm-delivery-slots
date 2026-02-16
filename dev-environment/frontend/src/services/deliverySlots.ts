import api from './api'

export interface DeliverySlot {
  id: number
  timeSlotTemplateId: number
  deliveryDate: string
  deliveryCost: number
  maxCapacity: number
  reservedCount: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface DeliverySlotPayload {
  timeSlotTemplateId: number
  deliveryDate: string
  deliveryCost: number
  maxCapacity: number
  reservedCount: number
  isActive: boolean
}

export async function getDeliverySlots(): Promise<DeliverySlot[]> {
  const response = await api.get<DeliverySlot[]>('/delivery-slots')
  return response.data
}

export async function createDeliverySlot(payload: DeliverySlotPayload): Promise<DeliverySlot> {
  const response = await api.post<DeliverySlot>('/delivery-slots', payload)
  return response.data
}

export async function updateDeliverySlot(id: number, payload: DeliverySlotPayload): Promise<DeliverySlot> {
  const response = await api.put<DeliverySlot>(`/delivery-slots/${id}`, payload)
  return response.data
}

export async function deleteDeliverySlot(id: number): Promise<void> {
  await api.delete(`/delivery-slots/${id}`)
}
