import api from './api'

export type CustomerType = 'ADMIN' | 'BUYER'

export interface Customer {
  id: number
  fullName: string
  email: string
  phone: string | null
  type: CustomerType
  createdAt: string
}

export interface CustomerPayload {
  fullName: string
  email: string
  phone?: string | null
  type: CustomerType
}

export async function getCustomers(): Promise<Customer[]> {
  const response = await api.get<Customer[]>('/customers')
  return response.data
}

export async function createCustomer(payload: CustomerPayload): Promise<Customer> {
  const response = await api.post<Customer>('/customers', payload)
  return response.data
}

export async function updateCustomer(id: number, payload: CustomerPayload): Promise<Customer> {
  const response = await api.put<Customer>(`/customers/${id}`, payload)
  return response.data
}

export async function deleteCustomer(id: number): Promise<void> {
  await api.delete(`/customers/${id}`)
}

export async function getCustomerByEmail(email: string): Promise<Customer> {
  const response = await api.get<Customer>('/customers/by-email', {
    params: { email },
  })
  return response.data
}
