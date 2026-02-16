import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import App from '../App'

describe('App', () => {
  it('renders login page when there is no active session', () => {
    render(<App />)
    expect(screen.getByText('Inicio de Sesión')).toBeInTheDocument()
  })
})
