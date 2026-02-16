import { useState, useEffect } from 'react'
import api from '../services/api'

interface HealthStatus {
  status: string
  database: string
  postgis: string
}

function Home() {
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await api.get('/health')
        setHealth(response.data)
        setError(null)
      } catch (err) {
        setError('No se pudo conectar con el backend')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    checkHealth()
  }, [])

  const getStatusClass = () => {
    if (loading) return 'loading'
    if (error) return 'error'
    return 'success'
  }

  return (
    <div className="app-container">
      <h1>Ventanas de Entrega</h1>
      <p>Gestion para revision de Full-Stack con Docker</p>

      <div className={`status-card ${getStatusClass()}`}>
        <h2>Estado del Sistema</h2>
        {loading && <p>Verificando conexiones...</p>}
        {error && <p>{error}</p>}
        {health && (
          <div>
            <p>Backend: {health.status}</p>
            <p>Base de Datos: {health.database}</p>
            <p>PostGIS: {health.postgis}</p>
          </div>
        )}
      </div>

      <div className="tech-stack">
        <span className="tech-badge">React 19</span>
        <span className="tech-badge">Spring Boot 4</span>
        <span className="tech-badge">Java 25</span>
        <span className="tech-badge">PostgreSQL 17</span>
        <span className="tech-badge">PostGIS 3.5</span>
        <span className="tech-badge">Docker</span>
      </div>

    </div>
  )
}

export default Home
