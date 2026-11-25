import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import App from './App.tsx'
import { createRegistry } from './games/core/registry.ts'
import { dummyGame } from './games/core/testing/dummyGame.tsx'

const games = createRegistry([dummyGame])

afterEach(() => {
  window.location.hash = ''
})

describe('App', () => {
  it('shows the home page heading', () => {
    render(<App games={createRegistry([])} />)
    expect(screen.getByRole('heading', { level: 1, name: 'clevee' })).toBeInTheDocument()
    expect(screen.getByText('Tady brzy budou hry.')).toBeInTheDocument()
  })

  it('lists registered games and opens one by its URL', () => {
    render(<App games={games} />)
    const link = screen.getByRole('link', { name: 'Testovací hra' })
    act(() => {
      window.location.hash = link.getAttribute('href') ?? ''
      window.dispatchEvent(new HashChangeEvent('hashchange'))
    })
    expect(screen.getByRole('heading', { name: 'Testovací hra' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Zkontrolovat' })).toBeInTheDocument()
  })

  it('says so for an unknown game id', () => {
    window.location.hash = '#/hra/neexistuje'
    render(<App games={games} />)
    expect(screen.getByText('Tuhle hru neznám.')).toBeInTheDocument()
  })
})
