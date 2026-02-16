import api from './api'

export interface TimeSlotTemplate {
  id: number
  startTime: string
  endTime: string
  isActive: boolean
}

export interface TimeSlotTemplatePayload {
  startTime: string
  endTime: string
  isActive: boolean
}

export async function getTimeSlotTemplates(): Promise<TimeSlotTemplate[]> {
  const response = await api.get<TimeSlotTemplate[]>('/time-slot-templates')
  return response.data
}

export async function createTimeSlotTemplate(
  payload: TimeSlotTemplatePayload
): Promise<TimeSlotTemplate> {
  const response = await api.post<TimeSlotTemplate>('/time-slot-templates', payload)
  return response.data
}

export async function updateTimeSlotTemplate(
  id: number,
  payload: TimeSlotTemplatePayload
): Promise<TimeSlotTemplate> {
  const response = await api.put<TimeSlotTemplate>(`/time-slot-templates/${id}`, payload)
  return response.data
}

export async function deleteTimeSlotTemplate(id: number): Promise<void> {
  await api.delete(`/time-slot-templates/${id}`)
}
