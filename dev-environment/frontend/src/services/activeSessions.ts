import api from './api'

export interface ActiveSession {
  id: number
  customerId: number
  startedAt: string
  expiresAt: string
  endedAt: string | null
  active: boolean
}

export async function loginActiveSession(customerId: number): Promise<ActiveSession> {
  const response = await api.post<ActiveSession>('/active-sessions/login', { customerId })
  return response.data
}

export async function validateActiveSession(sessionId: number): Promise<ActiveSession> {
  const response = await api.get<ActiveSession>(`/active-sessions/${sessionId}/validate`)
  return response.data
}

export async function closeActiveSession(sessionId: number): Promise<void> {
  await api.delete(`/active-sessions/${sessionId}`)
}
