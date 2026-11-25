import { act, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import App from './App.tsx'
import { createRegistry } from './games/core/registry.ts'
import { dummyGame } from './games/core/testing/dummyGame.tsx'
import { ATTEMPTS_KEY } from './games/core/attempts.ts'
import { GROWTH_KEY, loadGrowth } from './klicek/progress.ts'

const games = createRegistry([dummyGame])

afterEach(() => {
  window.location.hash = ''
  localStorage.clear()
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

  describe('Klíček on the home page', () => {
    it('starts as a seed', () => {
      render(<App games={games} />)
      expect(screen.getByRole('img', { name: 'Klíček, semínko' })).toBeInTheDocument()
    })

    it('grows from solved tasks in the stored history', () => {
      const solved = Array.from({ length: 40 }, (_, i) => ({
        gameId: 'dummy', difficulty: 1, seed: i, correct: true, durationMs: 1, hints: 0, at: i + 1,
      }))
      localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(solved))
      render(<App games={games} />)
      expect(screen.getByRole('img', { name: 'Klíček, mladý stromek' })).toBeInTheDocument()
      // Seen now, so the next visit does not repeat the change
      expect(loadGrowth(localStorage)).toMatchObject({ solved: 40, seen: 40 })
    })

    it('shows the last seen Klíček fading into the grown one', async () => {
      localStorage.setItem(GROWTH_KEY, JSON.stringify({ solved: 120, seen: 3, last: null }))
      const { container } = render(<App games={games} />)
      expect(screen.getByRole('img', { name: 'Klíček, jabloň s jablíčky' })).toBeInTheDocument()
      const layers = () =>
        [...container.querySelectorAll('.klicek svg')].map((s) => `${s.getAttribute('data-phase')} ${s.getAttribute('class')}`)
      expect(layers()).toEqual(['2 klicek__layer', '9 klicek__layer klicek__layer--hidden klicek__layer--after'])
      await waitFor(() =>
        expect(layers()).toEqual(['2 klicek__layer klicek__layer--hidden', '9 klicek__layer klicek__layer--after']),
      )
    })

    it('shows a single drawing when nothing changed since last time', () => {
      localStorage.setItem(GROWTH_KEY, JSON.stringify({ solved: 3, seen: 3, last: null }))
      const { container } = render(<App games={games} />)
      expect([...container.querySelectorAll('.klicek svg')].map((s) => s.getAttribute('class'))).toEqual(['klicek__layer'])
    })

    it('stays a seed and does not crash on corrupt storage', () => {
      localStorage.setItem(ATTEMPTS_KEY, '{oops')
      localStorage.setItem(GROWTH_KEY, '{oops')
      render(<App games={games} />)
      expect(screen.getByRole('img', { name: 'Klíček, semínko' })).toBeInTheDocument()
    })
  })
})
