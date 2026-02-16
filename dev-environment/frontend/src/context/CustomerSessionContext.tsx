import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { Customer } from '../services/customers'
import {
  closeActiveSession,
  loginActiveSession,
  validateActiveSession,
} from '../services/activeSessions'

const SESSION_KEY = 'customer_session'

interface StoredSession {
  customer: Customer
  sessionId: number
  expiresAt: string
}

interface CustomerSessionContextType {
  customer: Customer | null
  login: (customer: Customer) => Promise<void>
  logout: () => Promise<void>
  updateCustomerInSession: (customer: Customer) => void
  isAuthenticated: boolean
  isCheckingSession: boolean
}

const CustomerSessionContext = createContext<CustomerSessionContextType>({
  customer: null,
  login: async () => {},
  logout: async () => {},
  updateCustomerInSession: () => {},
  isAuthenticated: false,
  isCheckingSession: true,
})

function loadSession(): StoredSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null

    const stored = JSON.parse(raw) as StoredSession
    if (!stored || !stored.customer || !stored.sessionId || !stored.expiresAt) {
      sessionStorage.removeItem(SESSION_KEY)
      return null
    }

    if (new Date(stored.expiresAt).getTime() <= Date.now()) {
      sessionStorage.removeItem(SESSION_KEY)
      return null
    }

    return stored
  } catch {
    sessionStorage.removeItem(SESSION_KEY)
    return null
  }
}

export function CustomerSessionProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [sessionId, setSessionId] = useState<number | null>(null)
  const [isCheckingSession, setIsCheckingSession] = useState(true)

  const clearSession = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY)
    setCustomer(null)
    setSessionId(null)
  }, [])

  const logout = useCallback(async () => {
    const currentSessionId = sessionId
    clearSession()
    if (currentSessionId) {
      try {
        await closeActiveSession(currentSessionId)
      } catch {
        // Si la sesión ya expiró o no existe, el estado local igual debe cerrarse.
      }
    }
  }, [clearSession, sessionId])

  const login = useCallback(async (c: Customer) => {
    const session = await loginActiveSession(c.id)
    const stored: StoredSession = {
      customer: c,
      sessionId: session.id,
      expiresAt: session.expiresAt,
    }
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(stored))
    setCustomer(c)
    setSessionId(session.id)
  }, [])

  const updateCustomerInSession = useCallback((updatedCustomer: Customer) => {
    setCustomer(updatedCustomer)

    if (!sessionId) {
      return
    }

    const stored = loadSession()
    const expiresAt = stored?.expiresAt ?? new Date(Date.now() + 5 * 60 * 1000).toISOString()
    const updatedStoredSession: StoredSession = {
      customer: updatedCustomer,
      sessionId,
      expiresAt,
    }
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(updatedStoredSession))
  }, [sessionId])

  // Carga inicial y validación contra backend
  useEffect(() => {
    let mounted = true

    const initializeSession = async () => {
      const stored = loadSession()
      if (!stored) {
        if (mounted) {
          clearSession()
          setIsCheckingSession(false)
        }
        return
      }

      try {
        await validateActiveSession(stored.sessionId)
        if (mounted) {
          setCustomer(stored.customer)
          setSessionId(stored.sessionId)
        }
      } catch {
        if (mounted) {
          clearSession()
        }
      } finally {
        if (mounted) {
          setIsCheckingSession(false)
        }
      }
    }

    initializeSession()

    return () => {
      mounted = false
    }
  }, [clearSession])

  // Revalidación periódica de sesión activa
  useEffect(() => {
    if (!sessionId) return

    const interval = setInterval(() => {
      validateActiveSession(sessionId).catch(() => {
        clearSession()
      })
    }, 10_000)

    return () => clearInterval(interval)
  }, [clearSession, sessionId])

  return (
    <CustomerSessionContext.Provider
      value={{
        customer,
        login,
        logout,
        updateCustomerInSession,
        isAuthenticated: customer !== null,
        isCheckingSession,
      }}
    >
      {children}
    </CustomerSessionContext.Provider>
  )
}

export function useCustomerSession() {
  return useContext(CustomerSessionContext)
}
